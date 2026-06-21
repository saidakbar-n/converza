---
name: converza-passport-extract
description: Extract structured brand passport JSON from document text
---

# Brand Passport Extractor

Extract a Brand Passport from raw document text.

Return **ONLY** valid JSON:

```json
{
  "brand_name": "",
  "industry": "",
  "target_location": "O'zbekiston",
  "target_audience": "",
  "core_offer": "",
  "tone": "",
  "pricing": [{"tier": "", "price": "", "features": []}],
  "faq": [{"question": "", "answer": ""}],
  "objections": [{"objection": "", "response": ""}],
  "raw_notes": ""
}
```

All text fields in Uzbek. Empty lists where data is missing.
