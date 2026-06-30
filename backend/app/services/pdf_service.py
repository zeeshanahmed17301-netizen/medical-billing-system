"""
Invoice PDF Generation Service
Generates clean, patient-friendly PDF invoices with QR codes.
"""
import io
import qrcode
from datetime import date, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from loguru import logger


class PDFService:

    BRAND_BLUE = colors.HexColor("#1e40af")
    BRAND_LIGHT = colors.HexColor("#eff6ff")
    BRAND_DARK = colors.HexColor("#1e293b")
    GRAY = colors.HexColor("#64748b")
    LIGHT_GRAY = colors.HexColor("#f1f5f9")
    RED = colors.HexColor("#dc2626")

    def generate_qr_code(self, payment_url: str) -> io.BytesIO:
        """Generate QR code for payment URL."""
        qr = qrcode.QRCode(version=1, box_size=4, border=2)
        qr.add_data(payment_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf

    def generate_invoice_pdf(self, invoice_data: dict) -> bytes:
        """
        Generate a full invoice PDF.
        invoice_data keys: invoice_number, issue_date, due_date,
        patient, provider, line_items, subtotal, tax_amount,
        discount_amount, total_amount, balance_due, payment_url, notes
        """
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
        )

        styles = getSampleStyleSheet()
        elements = []

        # ── Header ──────────────────────────────────────────────────────
        header_data = [[
            Paragraph(
                f"<font color='#1e40af' size='18'><b>MEDICAL INVOICE</b></font>",
                ParagraphStyle("h", parent=styles["Normal"], fontSize=20, textColor=self.BRAND_BLUE)
            ),
            Paragraph(
                f"Invoice # <b>{invoice_data.get('invoice_number', '')}</b><br/>"
                f"Issued: {invoice_data.get('issue_date', date.today())}<br/>"
                f"Due: {invoice_data.get('due_date', '')}",
                ParagraphStyle("right", parent=styles["Normal"], alignment=TA_RIGHT, fontSize=9, textColor=self.BRAND_DARK)
            )
        ]]
        header_table = Table(header_data, colWidths=[4*inch, 3*inch])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, 0), 2, self.BRAND_BLUE),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 16))

        # ── Provider & Patient Info ──────────────────────────────────────
        provider = invoice_data.get("provider", {})
        patient = invoice_data.get("patient", {})

        info_data = [[
            Paragraph(
                f"<b>FROM (Provider)</b><br/>"
                f"{provider.get('facility_name','')}<br/>"
                f"{provider.get('provider_name','')}<br/>"
                f"NPI: {provider.get('npi','')}<br/>"
                f"{provider.get('address','')}<br/>"
                f"{provider.get('phone','')}",
                ParagraphStyle("info", parent=styles["Normal"], fontSize=9, leading=14)
            ),
            Paragraph(
                f"<b>BILL TO (Patient)</b><br/>"
                f"{patient.get('name','')}<br/>"
                f"DOB: {patient.get('dob','')}<br/>"
                f"ID: {patient.get('patient_id','')}<br/>"
                f"{patient.get('address','')}<br/>"
                f"{patient.get('phone','')}",
                ParagraphStyle("info", parent=styles["Normal"], fontSize=9, leading=14)
            )
        ]]
        info_table = Table(info_data, colWidths=[3.5*inch, 3.5*inch])
        info_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), self.BRAND_LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 10),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#bfdbfe")),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))

        # ── Line Items ───────────────────────────────────────────────────
        elements.append(Paragraph("<b>Services Rendered</b>",
            ParagraphStyle("sectionhead", parent=styles["Normal"], fontSize=11, textColor=self.BRAND_BLUE, spaceAfter=6)))

        table_header = ["CPT Code", "Description", "ICD-10", "Qty", "Unit Price", "Total"]
        table_data = [table_header]

        for item in invoice_data.get("line_items", []):
            table_data.append([
                item.get("cpt_code", ""),
                Paragraph(item.get("description", ""), ParagraphStyle("cell", parent=styles["Normal"], fontSize=8)),
                ", ".join(item.get("icd10_codes", [])),
                str(item.get("quantity", 1)),
                f"${item.get('unit_price', 0):.2f}",
                f"${item.get('total', 0):.2f}",
            ])

        col_widths = [0.9*inch, 2.6*inch, 0.9*inch, 0.4*inch, 0.9*inch, 0.8*inch]
        line_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        line_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), self.BRAND_BLUE),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, self.LIGHT_GRAY]),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(line_table)
        elements.append(Spacer(1, 16))

        # ── Totals & QR ──────────────────────────────────────────────────
        subtotal = invoice_data.get("subtotal", 0)
        tax = invoice_data.get("tax_amount", 0)
        discount = invoice_data.get("discount_amount", 0)
        total = invoice_data.get("total_amount", 0)
        balance = invoice_data.get("balance_due", 0)
        payment_url = invoice_data.get("payment_url", "https://pay.example.com")

        qr_buf = self.generate_qr_code(payment_url)
        qr_img = Image(qr_buf, width=1.2*inch, height=1.2*inch)

        totals = [
            ["Subtotal:", f"${subtotal:.2f}"],
            ["Tax:", f"${tax:.2f}"],
            ["Discount:", f"-${discount:.2f}"],
            ["Total Charged:", f"${total:.2f}"],
            ["Balance Due:", f"${balance:.2f}"],
        ]
        totals_table = Table(totals, colWidths=[1.5*inch, 1*inch])
        totals_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("LINEABOVE", (0, -1), (-1, -1), 1.5, self.BRAND_BLUE),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, -1), (-1, -1), 11),
            ("TEXTCOLOR", (0, -1), (-1, -1), self.RED),
        ]))

        qr_label = Paragraph(
            f"<b>Pay Online</b><br/><font size='7'>{payment_url}</font>",
            ParagraphStyle("qr", parent=styles["Normal"], fontSize=8, alignment=TA_CENTER)
        )
        bottom_data = [[totals_table, "", Paragraph(""), qr_img, qr_label]]
        bottom_table = Table(bottom_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1.2*inch, 1.3*inch])
        bottom_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (3, 0), (4, 0), "CENTER"),
        ]))
        elements.append(bottom_table)

        # ── Notes ────────────────────────────────────────────────────────
        if invoice_data.get("notes"):
            elements.append(Spacer(1, 14))
            elements.append(Paragraph(f"<b>Notes:</b> {invoice_data['notes']}",
                ParagraphStyle("notes", parent=styles["Normal"], fontSize=8, textColor=self.GRAY)))

        # ── Footer ───────────────────────────────────────────────────────
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(
            "This is an automated invoice. For billing inquiries call 1-800-MED-BILL or email billing@provider.com. "
            "HIPAA-compliant document — contains protected health information.",
            ParagraphStyle("footer", parent=styles["Normal"], fontSize=7, textColor=self.GRAY, alignment=TA_CENTER)
        ))

        doc.build(elements)
        return buf.getvalue()

    def generate_claim_pdf(self, claim_data: dict) -> bytes:
        """
        Generate a CMS-1500 style claim PDF.
        """
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
        )

        styles = getSampleStyleSheet()
        elements = []

        # Simplified representation of a CMS-1500 for the MVP
        elements.append(Paragraph(
            f"<font color='#dc2626' size='18'><b>HEALTH INSURANCE CLAIM FORM</b></font>",
            ParagraphStyle("h", parent=styles["Normal"], fontSize=20, textColor=self.RED, alignment=TA_CENTER)
        ))
        elements.append(Spacer(1, 20))
        
        elements.append(Paragraph(f"<b>Claim ID:</b> {claim_data.get('claim_id', 'N/A')}", styles["Normal"]))
        elements.append(Paragraph(f"<b>Patient Name:</b> {claim_data.get('patient_name', 'N/A')}", styles["Normal"]))
        elements.append(Paragraph(f"<b>Provider:</b> {claim_data.get('provider_name', 'N/A')}", styles["Normal"]))
        elements.append(Paragraph(f"<b>Total Charge:</b> ${claim_data.get('total_charge', 0):.2f}", styles["Normal"]))
        
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<b>Diagnosis Codes (ICD-10):</b>", styles["Normal"]))
        for icd in claim_data.get("diagnoses", []):
            elements.append(Paragraph(f"- {icd}", styles["Normal"]))

        elements.append(Spacer(1, 10))
        elements.append(Paragraph("<b>Services (CPT/HCPCS):</b>", styles["Normal"]))
        for srv in claim_data.get("services", []):
            elements.append(Paragraph(f"- {srv.get('cpt')} (${srv.get('charge', 0):.2f})", styles["Normal"]))

        doc.build(elements)
        return buf.getvalue()

    def generate_superbill_pdf(self, superbill_data: dict) -> bytes:
        """
        Generate a superbill/encounter form PDF.
        """
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph(
            f"<font color='#1e40af' size='18'><b>SUPERBILL / ENCOUNTER FORM</b></font>",
            ParagraphStyle("h", parent=styles["Normal"], fontSize=20, textColor=self.BRAND_BLUE, alignment=TA_CENTER)
        ))
        elements.append(Spacer(1, 20))
        
        elements.append(Paragraph(f"<b>Patient:</b> {superbill_data.get('patient_name', 'N/A')}", styles["Normal"]))
        elements.append(Paragraph(f"<b>Date of Service:</b> {superbill_data.get('date', date.today().isoformat())}", styles["Normal"]))
        
        doc.build(elements)
        return buf.getvalue()


pdf_service = PDFService()
