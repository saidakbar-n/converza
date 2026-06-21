import json

PASSPORT_SCHEMA = {
    "brand_name": "string",
    "industry": "string",
    "target_location": "string",
    "target_audience": "string",
    "core_offer": "string",
    "tone": "string",
    "brand_voice": "string",
    "pricing": [{"tier": "string", "price": "string", "features": ["string"]}],
    "faq": [{"question": "string", "answer": "string"}],
    "objections": [{"objection": "string", "response": "string"}],
    "raw_notes": "string",
}


def build_parser_system_prompt(*, web: bool = False) -> str:
    if web:
        return (
            "Siz biznes hujjatlarini tahlil qiluvchi AI tizimisiz.\n"
            "Berilgan matnlardan strukturalangan Brand Passport JSON yarating.\n"
            "Barcha matn maydonlari O'zbek tilida bo'lsin.\n"
            "Faqat quyidagi JSON strukturasini qaytaring, boshqa hech narsa yozmang:\n"
            f"{json.dumps(PASSPORT_SCHEMA, ensure_ascii=False)}\n\n"
            "Agar pricing, faq yoki objections topilmasa, [] qaytaring. "
            "brand_name topilmasa, hujjatdagi kompaniya nomidan foydalaning."
        )
    return (
        "Siz biznes ma'lumotlarini tahlil qiluvchi AI tizimisiz.\n"
        "Berilgan matndan strukturalangan Brand Passport JSON yarating.\n"
        "Barcha matn maydonlari o'zbek tilida bo'lsin.\n"
        "Faqat quyidagi JSON strukturasini qaytaring, boshqa hech narsa yozmang:\n"
        f"{json.dumps(PASSPORT_SCHEMA, ensure_ascii=False)}\n\n"
        "pricing, faq, objections bo'sh bo'lsa [] qaytaring."
    )
