# truemark_certificate_generator/generator.py
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import qrcode
from pathlib import Path

# Register fonts
for font in ["Regular", "Bold", "Italic"]:
    try:
        pdfmetrics.registerFont(TTFont(f"Garamond-{font}", f"fonts/EB_Garamond/EBGaramond-{font}.ttf"))
    except:
        # Fallback if fonts not found
        pass
try:
    pdfmetrics.registerFont(TTFont("Courier", "fonts/Courier_Prime/CourierPrime.ttf"))
except:
    # Fallback if font not found
    pass

def create_certificate(data: dict, output_path: str):
    c = canvas.Canvas(output_path, pagesize=A4)
    w, h = A4

    # Background & security
    try:
        c.drawImage("templates/parchment.jpg", 0, 0, width=w, height=h)
        c.drawImage("templates/border_guilloche.svg", 0, 0, width=w, height=h)
        c.setFillAlpha(0.12)
        c.drawImage("templates/tree_watermark.svg", w*0.2, h*0.25, width=w*0.6, preserveAspectRatio=True)
    except:
        # Fallback if images not found - create plain background
        c.setFillColor(HexColor("#F5F5DC"))
        c.rect(0, 0, w, h, fill=1)

    # Header
    try:
        c.setFont("Garamond-Bold", 52)
    except:
        c.setFont("Helvetica-Bold", 52)
    c.setFillColor(HexColor("#0F2E74"))
    c.drawCentredString(w/2, h - 1.6*inch, "TRUEMARK®")
    try:
        c.setFont("Garamond-Bold", 28)
    except:
        c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(w/2, h - 2.2*inch, "CERTIFICATE OF AUTHENTICITY")

    # Data grid
    c.setFillColorRGB(0,0,0)
    try:
        c.setFont("Garamond-Bold", 11)
    except:
        c.setFont("Helvetica-Bold", 11)
    y = h - 4*inch
    left_col = 1.4*inch
    right_col = 4.2*inch

    fields = [
        ("Owner Name", data["owner_name"]),
        ("Asset Title", data["asset_title"]),
        ("Web3 Wallet Address", data["wallet"]),
        ("NFT Classification (KEP Category)", data["kep_category"]),
        ("TrueMark Web3 Domain", data["web3_domain"]),
        ("Chain ID", data["chain_id"]),
        ("IPFS Hash", data["ipfs_hash"]),
        ("Issue Stardate", data["stardate"]),
        ("DALS Serial Number", data["dals_serial"]),
        ("Signature Verification ID", data["sig_id"]),
    ]

    for i, (label, value) in enumerate(fields):
        try:
            c.setFont("Garamond-Bold", 11)
        except:
            c.setFont("Helvetica-Bold", 11)
        c.drawString(left_col if i < 5 else right_col, y - (i%5)*0.48*inch, label)
        try:
            c.setFont("Courier", 11)
        except:
            c.setFont("Courier", 11)
        c.drawString(left_col + 2.1*inch if i < 5 else right_col + 1.8*inch, y - (i%5)*0.48*inch, value)

    # QR + Seal
    try:
        qr = qrcode.make(data["verification_url"])
        c.drawInlineImage(qr, w - 2.8*inch, 0.8*inch, width=1.8*inch, height=1.8*inch)
        c.drawImage("templates/seal_gold.png", w - 3.2*inch, 0.6*inch, width=2.2*inch, height=2.2*inch)
    except:
        # Fallback - draw text QR placeholder
        c.setFont("Helvetica", 10)
        c.drawString(w - 2.8*inch, 1.5*inch, "QR Code")
        c.drawString(w - 2.8*inch, 1.3*inch, "Verification")

    # Signature
    try:
        c.setFont("Garamond-Bold", 16)
    except:
        c.setFont("Helvetica-Bold", 16)
    c.drawString(1.5*inch, 1.3*inch, "__________________________________        __________________")
    try:
        c.setFont("Garamond", 12)
    except:
        c.setFont("Helvetica", 12)
    c.drawString(1.6*inch, 1.1*inch, "TrueMark Authorized Officer")
    c.drawString(5.2*inch, 1.1*inch, "Date")

    c.save()
    print(f"TRUEMARK CERTIFICATE MINTED → {output_path}")