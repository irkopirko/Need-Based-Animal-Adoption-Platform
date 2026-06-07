#!/usr/bin/env python3
"""Insert new diagrams, short red captions, and updated access matrix into SDD ODT."""

import re
import shutil
import zipfile
from pathlib import Path

SRC = Path("/Users/iremcelik/Downloads/SDD_22SOFT1030_21SOFT1087-2.odt")
OUT = Path("/Users/iremcelik/Downloads/SDD_22SOFT1030_21SOFT1087-2.odt")
ASSETS = Path(
    "/Users/iremcelik/.cursor/projects/"
    "Users-iremcelik-Desktop-Need-Based-Animal-Adoption-Platform-main-2-"
    "Need-Based-Animal-Adoption-Platform-1/assets"
)

NEW_IMAGES = [
    ("reportingmoderationcomponent-9de3e282-6f8e-4426-adba-06098b6e7033.png", "image10.png"),
    ("savedanimalscomponent-f91d7b1c-7dad-41d6-a888-6ff8706d304a.png", "image11.png"),
    ("adoptioncasestate-9a0363d6-03cb-4beb-8f14-b69bc37dc594.png", "image12.png"),
    ("listinginquiry-eb7a0be9-6d0d-4782-8b1a-7b7317867bad.png", "image13.png"),
    ("listingreportstate-9022983b-bdf7-42c7-a968-b1106da3b9a6.png", "image14.png"),
]


def red(text: str) -> str:
    return f'<text:span text:style-name="T_Red">{text}</text:span>'


def para(*parts: str, style: str = "Normal") -> str:
    body = "".join(parts)
    return f'<text:p text:style-name="{style}">{body}</text:p>'


def image_frame(href: str, width: str = "5.8in", height: str = "3.2in") -> str:
    return (
        f'<text:p text:style-name="Normal">'
        f'<draw:frame draw:style-name="fr1" draw:name="drawing" text:anchor-type="as-char" '
        f'svg:x="0in" svg:y="0in" svg:width="{width}" svg:height="{height}" '
        f'style:rel-width="scale" style:rel-height="scale">'
        f'<draw:image xlink:href="media/{href}" xlink:type="simple" '
        f'xlink:show="embed" xlink:actuate="onLoad"/>'
        f'<svg:title/><svg:desc/>'
        f"</draw:frame>"
        f"</text:p>"
    )


def cell(lines) -> str:
    if isinstance(lines, str):
        lines = [lines]
    inner = "".join(para(red(line)) for line in lines)
    return f"<table:table-cell>{inner}</table:table-cell>"


def build_access_matrix_table() -> str:
    headers = [
        "Object \\ Role",
        "User Account",
        "Adopter Profile & Adoption Request",
        "Animal Listing",
        "Match Snapshots",
        "Saved Animals",
        "Listing Inquiries",
        "Inquiry Messages",
        "Adoption Cases",
        "Listing Reports",
        "System Data",
    ]
    rows = [
        ("Guest", ["Register", "-", "Read", "-", "-", "-", "-", "-", "-", "-"]),
        (
            "Adopter",
            [
                "Create, Read, Update (own)",
                "Create, Read, Update (own)",
                "Read",
                "Read, Refresh (own)",
                "Create, Delete, Read (own)",
                "Create, Read (own)",
                "Send, Receive",
                "Read, Cancel (own)",
                "Create, Read (own)",
                "-",
            ],
        ),
        (
            "Owner / Shelter",
            [
                "Create, Read, Update (own)",
                "-",
                "Create, Read, Update, Archive (own)",
                "-",
                "-",
                "Read, Accept, Reject (own)",
                "Send, Receive",
                "Accept, Reserve, Complete, Cancel",
                "-",
                "-",
            ],
        ),
        (
            "Admin",
            [
                "Full Access",
                "Read All",
                "Full Access + Moderate",
                "Read All",
                "Full Access",
                "Monitor",
                "Monitor",
                "Monitor",
                "Resolve, Moderate",
                "Full Access",
            ],
        ),
    ]

    cols = "".join('<table:table-column table:style-name="TableColumn259"/>' for _ in headers)
    header_row = "<table:table-row>" + "".join(cell(h) for h in headers) + "</table:table-row>"
    data_rows = ""
    for role, values in rows:
        data_rows += "<table:table-row>" + cell(role) + "".join(cell(v) for v in values) + "</table:table-row>"

    return (
        '<table:table table:style-name="Table257">'
        f"<table:table-columns>{cols}</table:table-columns>"
        f"{header_row}{data_rows}"
        "</table:table>"
    )


def build_component_block(figure_no: str, title: str, image: str, description: str, height: str) -> str:
    return (
        para()
        + image_frame(image, height=height)
        + para(red(f"Figure {figure_no}. {title}"))
        + para(red(description))
        + para()
    )


def build_state_block(figure_no: str, title: str, image: str, description: str) -> str:
    return (
        para()
        + image_frame(image, width="4.2in", height="2.8in")
        + para(red(f"Figure {figure_no}. {title}"))
        + para(red(description))
        + para()
    )


def ensure_red_style(styles_xml: str) -> str:
    if "T_Red" in styles_xml:
        return styles_xml
    insert = (
        '<style:style style:name="T_Red" style:family="text">'
        '<style:text-properties fo:color="#FF0000"/>'
        "</style:style>"
    )
    anchor = '<office:automatic-styles>'
    return styles_xml.replace(anchor, anchor + insert, 1)


def ensure_frame_style(styles_xml: str) -> str:
    if 'style:name="fr1"' in styles_xml:
        return styles_xml
    insert = (
        '<style:style style:name="fr1" style:family="graphic" style:parent-style-name="Frame">'
        '<style:graphic-properties style:vertical-pos="top" style:vertical-rel="paragraph" '
        'style:horizontal-pos="center" style:horizontal-rel="paragraph" '
        'style:mirror="none" fo:clip="rect(0in, 0in, 0in, 0in)" draw:luminance="0%" '
        'draw:contrast="0%" draw:red="0%" draw:green="0%" draw:blue="0%" '
        'draw:gamma="100%" draw:color-inversion="false" draw:image-opacity="100%" '
        'draw:color-mode="standard"/>'
        "</style:style>"
    )
    anchor = '<office:automatic-styles>'
    return styles_xml.replace(anchor, anchor + insert, 1)


def main() -> None:
    work = Path("/tmp/sdd_update_work")
    if work.exists():
        shutil.rmtree(work)
    work.mkdir()

    with zipfile.ZipFile(SRC, "r") as zin:
        zin.extractall(work)

    content_path = work / "content.xml"
    styles_path = work / "styles.xml"
    manifest_path = work / "META-INF" / "manifest.xml"

    content = content_path.read_text(encoding="utf-8")
    styles = styles_path.read_text(encoding="utf-8")
    manifest = manifest_path.read_text(encoding="utf-8")

    styles = ensure_red_style(styles)
    styles = ensure_frame_style(styles)

    # --- Insert component diagrams after Figure 2.4 (Animal Management) ---
    component_insert = (
        build_component_block(
            "2.5",
            "Component diagram for the system (Reporting & Moderation Subsystem)",
            "image10.png",
            "This diagram shows how adopters submit listing reports and how administrators review and moderate listings.",
            "3.4in",
        )
        + build_component_block(
            "2.6",
            "Component diagram for the system (Saved Animals & Adoption Case Subsystems)",
            "image11.png",
            "This diagram shows how adopters save favorite listings and how adoption cases are managed after an inquiry is accepted.",
            "3.6in",
        )
    )

    animal_marker = (
        "This separation ensures that animal ad management is carried out in a modular, "
        "secure, and easy-to-maintain structure.</text:p>"
    )
    if animal_marker not in content:
        raise SystemExit("Animal Management insertion marker not found")
    if "Figure 2.5" not in content:
        content = content.replace(animal_marker, animal_marker + component_insert, 1)

    # --- Insert state machines in Boundary Conditions ---
    state_intro = para(
        red(
            "The lifecycle transitions of AdoptionCase, ListingInquiry, and ListingReport "
            "are defined by the state machine diagrams below."
        )
    )
    state_insert = state_intro + build_state_block(
        "7",
        "State machine diagram for AdoptionCase lifecycle",
        "image12.png",
        "This diagram defines the adoption case flow from PROPOSED to COMPLETED or CANCELLED.",
    ) + build_state_block(
        "8",
        "State machine diagram for ListingInquiry lifecycle",
        "image13.png",
        "This diagram defines how an inquiry moves from PENDING to ACCEPTED or REJECTED.",
    ) + build_state_block(
        "9",
        "State machine diagram for ListingReport lifecycle",
        "image14.png",
        "This diagram defines how a report moves from PENDING to RESOLVED or DISMISSED.",
    )

    boundary_marker = (
        "These mechanisms provide robustness and fault tolerance.</text:span></text:p>"
        '<text:p text:style-name="P400"/>'
    )
    if boundary_marker not in content:
        raise SystemExit("Boundary Conditions insertion marker not found")
    if "Figure 7" not in content or "State machine diagram for AdoptionCase" not in content:
        content = content.replace(boundary_marker, boundary_marker + state_insert, 1)

    # --- Replace access matrix table ---
    matrix_start = content.find('<table:table table:style-name="Table257">')
    matrix_end = content.find("</table:table>", matrix_start) + len("</table:table>")
    if matrix_start < 0:
        raise SystemExit("Access matrix table not found")
    old_table = content[matrix_start:matrix_end]
    if "Match Results" in old_table and "Listing Inquiries" not in old_table:
        new_table = build_access_matrix_table()
        content = content[:matrix_start] + new_table + content[matrix_end:]

        # Red note after matrix caption
        auth_note = para(
            red(
                "Authorization is enforced at the application service layer and React route guards; "
                "the matrix above describes intended role permissions."
            )
        )
        figure5_caption = (
            '<text:p text:style-name="P370"><text:span text:style-name="T371">Figure 5.<text:s/></text:span>'
            "The Access Matrix for the System</text:p>"
        )
        if figure5_caption in content and "intended role permissions" not in content:
            content = content.replace(figure5_caption, figure5_caption + auth_note, 1)

    content_path.write_text(content, encoding="utf-8")
    styles_path.write_text(styles, encoding="utf-8")

    media_dir = work / "media"
    media_dir.mkdir(exist_ok=True)
    for src_name, dest_name in NEW_IMAGES:
        src = ASSETS / src_name
        if not src.exists():
            raise SystemExit(f"Missing asset: {src}")
        shutil.copy2(src, media_dir / dest_name)
        entry = (
            f'<manifest:file-entry manifest:full-path="media/{dest_name}" '
            f'manifest:media-type="image/png"/>'
        )
        if dest_name not in manifest:
            manifest = manifest.replace("</manifest:manifest>", entry + "</manifest:manifest>")

    manifest_path.write_text(manifest, encoding="utf-8")

    if OUT.exists():
        backup = OUT.with_suffix(".odt.bak")
        shutil.copy2(OUT, backup)

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zout:
        mimetype = (work / "mimetype").read_text(encoding="utf-8")
        zout.writestr("mimetype", mimetype, compress_type=zipfile.ZIP_STORED)
        for file in work.rglob("*"):
            if file.is_file() and file.name != "mimetype":
                zout.write(file, file.relative_to(work).as_posix())

    print(f"Updated: {OUT}")
    print(f"Backup:  {OUT.with_suffix('.odt.bak')}")


if __name__ == "__main__":
    main()
