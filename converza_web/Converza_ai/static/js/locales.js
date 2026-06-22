/**
 * Converza UI translations — Uzbek (Latin), Russian, English.
 * Flat dot-notation keys for i18n lookup.
 */
window.CONVERZA_LOCALES = {
  uz: {
    // Nav
    "nav.signIn": "Kirish",
    "nav.bookPilot": "Pilot bron qilish",
    "nav.infrastructure": "Infratuzilma",
    "nav.protocol": "Protokol",
    "nav.capabilities": "Imkoniyatlar",

    // Landing hero
    "landing.hero.pill": "Tizim faol: 24/7 DM",
    "landing.hero.title1": "Kechki smenani",
    "landing.hero.title2": "Almashtiring.",
    "landing.hero.sub": "Telegram savdo suhbatlarini avtomatlashtiring. Mijozlarga javob bering, Click hisob-fakturalarini yuboring va bitimlarni yoping — operatorlar yollamasdan va ish vaqtidan keyin xabarlarni o'tkazib yubormasdan. Inson boshqaruvi talab qilinmaydi.",
    "landing.hero.cta": "Pilotingizni bron qiling",
    "landing.hero.checkCancel": "Istalgan vaqtda bekor qilish",
    "landing.hero.checkData": "Ma'lumotlaringiz sizda qoladi",
    "landing.hero.nodeLabel": "Node 04 / DM navbati",

    // Landing features
    "landing.features.heading": "Algoritmlar yarim tun xabarlarini o'tkazib yubormaydi.",
    "landing.features.card1Tag": "Komponent // 01",
    "landing.features.card1Title": "Telegram Business'da avtonom DM closer o'rnating.",
    "landing.features.card1Desc": "Biznes hisobingizni ulang va Converza brend pasportingiz asosida kiruvchi savdo suhbatlarini boshqarishini ta'minlang.",
    "landing.features.card2Tag": "Komponent // 02",
    "landing.features.card2Title": "Har bir mijozga soniyalar ichida, kechayu kunduz javob bering.",
    "landing.features.card2Desc": "Tizimga narxlaringiz, FAQ va ohangingizni bering — siz uxlayotganingizda ham brendga mos javoblar oling.",
    "landing.features.card3Tag": "Komponent // 03",
    "landing.features.card3Title": "Inson kechikishini va operator xarajatlarini yo'q qiling.",
    "landing.features.card3Desc": "Smena jadvalini unuting. Avtomatik follow-up va Click to'lov havolalari siz belgilagan jadvalda ishga tushadi.",
    "landing.features.terminalLive": "JONLI OQIM",
    "landing.features.deploySchedule": "Jadvalni ishga tushirish",

    // Landing philosophy
    "landing.philosophy.lead": "Ko'pchilik o'zbek bizneslari quyidagiga e'tibor beradi:",
    "landing.philosophy.leadEm": "har bir Telegram DM'ga qo'lda javob berish.",
    "landing.philosophy.focusLabel": "Biz quyidagiga e'tibor beramiz:",
    "landing.philosophy.focusText": "avtonom yopish.",

    // Landing protocol
    "landing.protocol.heading": "Joylashtirish protokoli.",
    "landing.protocol.phase1Code": "SYSTEM.PHASE_01",
    "landing.protocol.phase1Title": "Brend pasportini belgilash",
    "landing.protocol.phase1Desc": "Logotiplar, narxlar, FAQ va ohangni yuklang. DM closer brendingizning matematik modelini yaratadi va har bir javobga bog'laydi.",
    "landing.protocol.phase2Code": "SYSTEM.PHASE_02",
    "landing.protocol.phase2Title": "Terminalni ko'rib chiqish",
    "landing.protocol.phase2Desc": "Ish maydoningizda DM Closer qoidalarini sozlang. Javob shablonlarini tasdiqlang, to'lov darajalarini belgilang va e'tiroz handlerlarini sozlang.",
    "landing.protocol.phase3Code": "SYSTEM.PHASE_03",
    "landing.protocol.phase3Title": "Telegram joylashtirish",
    "landing.protocol.phase3Desc": "Telegram Business'ni @ConverzaSales_bot orqali ulang. Tasdiqlangan javoblar va Click hisob-fakturalar avtomatik oqadi.",

    // Landing pilot CTA
    "landing.pilot.badge": "Q3 Pilot kirish",
    "landing.pilot.title": "Uxlayotganingizda mijozlarni yo'qotishni to'xtating.",
    "landing.pilot.desc": "O'zbekiston va MDH'dagi Telegram-first bizneslar uchun Q3 onboarding ochilmoqda. Sinov-xato qilmang — protokol sizning o'rningizda yopishni bajarsin.",
    "landing.pilot.cta": "O'z joyingizni band qiling",
    "landing.pilot.footnote": "Istalgan vaqtda bekor qilish",

    // Landing footer
    "landing.footer.status": "Tizim ishlamoqda",

    // Landing shuffle cards
    "landing.shuffle.card1": "Node 01: Brend pasporti",
    "landing.shuffle.card2": "Node 08: DM javob dvigateli",
    "landing.shuffle.card3": "Node 19: Click to'lovlar",
    "landing.shuffle.statusActive": "FAOL",
    "landing.shuffle.statusSyncing": "SINXRON",
    "landing.shuffle.statusReady": "TAYYOR",

    // App nav
    "app.nav.dmCloser": "DM Closer",
    "app.nav.copilot": "Co-Pilot",

    // App passport
    "app.passport.title": "Brend pasporti",
    "app.passport.subtitle": "DM Closer ishlashi uchun to'ldiring.",
    "app.passport.proofTitle": "1-hafta",
    "app.passport.proofDesc": "Kechki xabarlarga javob, to'lovga olib kelish.",
    "app.passport.brandInfo": "Brend ma'lumotlari",

    // App metrics
    "app.metrics.brand": "Brend maydonlari",
    "app.metrics.pricing": "Narxlar",
    "app.metrics.faq": "FAQ",
    "app.metrics.objections": "E'tirozlar",

    // App connection
    "app.connection.title": "Telegram Business",
    "app.connection.desc": "DM Closer biznes hisobingiz orqali javob beradi.",
    "app.connection.checking": "Tekshirilmoqda...",
    "app.connection.active": "Biznes ulanishi faol",
    "app.connection.inactive": "Biznes ulanishi yo'q",
    "app.connection.subChecking": "Obuna: tekshirilmoqda...",
    "app.connection.subActive": "Converza obunasi faol",
    "app.connection.subInactive": "Obuna yo'q — @ConverzaApp_bot /subscribe",
    "app.connection.payChecking": "Mijozlar Click: tekshirilmoqda...",
    "app.connection.payActive": "Mijozlar Click to'lovi yoqilgan",
    "app.connection.payInactive": "Mijozlar Click yo'q (ixtiyoriy)",
    "app.connection.salesBotHint": "Sales bot: Sozlamalar → Business → Chatbots →",
    "app.connection.subscribeHint": "Converza obunasi: @ConverzaApp_bot da /subscribe",
    "app.connection.statusFailed": "Holatni yuklab bo'lmadi",
    "app.connection.subUnknown": "Obuna holati noma'lum",
    "app.connection.payUnknown": "Click holati noma'lum",

    // App PDF
    "app.pdf.title": "PDF dan to'ldirish",
    "app.pdf.subtitle": "Hujjat yuklang — pasport avtomatik yaratiladi.",
    "app.pdf.drop": "PDF fayllarni shu yerga tashlang yoki",
    "app.pdf.browse": "tanlang",
    "app.pdf.clear": "Tozalash",
    "app.pdf.generate": "PDF'dan yaratish",
    "app.pdf.analyzing": "ta hujjat tahlil qilinmoqda... ⏳",
    "app.pdf.success": "ta PDF dan yaratildi. Tekshirib saqlang.",
    "app.pdf.errorPrefix": "Xatolik:",

    // App form labels
    "app.passport.formTitle": "Brend ma'lumotlari",
    "app.passport.brandName": "Biznes nomi",
    "app.passport.industry": "Soha",
    "app.passport.location": "Joylashuv",
    "app.passport.tone": "Muloqot ohangi",
    "app.passport.coreOffer": "Asosiy taklif",
    "app.passport.targetAudience": "Maqsadli auditoriya",
    "app.passport.rawNotes": "Closer eslatmalari",
    "app.passport.pricingLabel": "Narxlar (Click uchun)",
    "app.passport.addPricing": "Narx qo'shish",
    "app.passport.faqLabel": "FAQ",
    "app.passport.addFaq": "Savol-javob qo'shish",
    "app.passport.objectionsLabel": "Keng tarqalgan e'tirozlar",
    "app.passport.addObjection": "E'tiroz qo'shish",
    "app.passport.orgNotice": "DM Closer va Co-Pilot shu pasportdan foydalanadi.",
    "app.passport.orgNotLoggedIn": "kirilmagan",
    "app.passport.salesBot": "Sotuv boti (Business DM)",
    "app.passport.clickToken": "Click token (ixtiyoriy)",
    "app.passport.clickTokenHint": "O'z Click provider tokeningizni qo'shsangiz, mijozlarga to'lov havolasi yuboriladi. Token bermasangiz, DM Closer faqat matnli javob beradi.",

    // App tone options
    "app.tone.friendly": "Samimiy, ishonchli va lo'nda",
    "app.tone.professional": "Professional va to'g'ridan-to'g'ri",
    "app.tone.warm": "Iliq va maslahatchi",

    // App placeholders
    "app.placeholder.brandName": "Converza",
    "app.placeholder.industry": "Telegram sotuv avtomatlashtirish",
    "app.placeholder.coreOffer": "Biz bizneslarga kechki mijozlarni yo'qotmaslik uchun oddiy DM Closer sotamiz.",
    "app.placeholder.audience": "Telegram orqali sotadigan va ish vaqtidan keyin mijozlarni yo'qotadigan o'zbek kichik bizneslari.",
    "app.placeholder.rawNotes": "Qaytarish, yetkazish, taqiqlangan mavzular.",
    "app.placeholder.tier": "Telegram Pro",
    "app.placeholder.price": "$30 yoki 375000 so'm",
    "app.placeholder.features": "kelgan xabarlarga javob berish, hisob-faktura yuborish",
    "app.placeholder.faqQ": "Kechasi ham ishlaydimi?",
    "app.placeholder.faqA": "Ha, closer 24/7 javob bera oladi.",
    "app.placeholder.objection": "Juda qimmat",
    "app.placeholder.response": "Bitta qaytarilgan savdo rejaning narxini qoplaydi.",
    "app.placeholder.clickToken": "BotFather → Payments → Click",

    // App copilot
    "app.copilot.title": "Co-Pilot",
    "app.copilot.subtitle": "Strategiya va matnlar — brend pasportingiz asosida.",
    "app.copilot.ready": "Tayyor",
    "app.copilot.loadedDesc": "Saqlangan pasport yuklangan.",
    "app.copilot.welcome": "O'zbek, rus yoki ingliz tilida yozing — strategiya, matn, e'tirozlar yoki kontent rejasi bo'yicha yordam beraman.",
    "app.copilot.placeholder": "Co-Pilot'ga yozing...",
    "app.copilot.send": "Yuborish",
    "app.copilot.errorSignIn": "Avval Telegram orqali kiring.",
    "app.copilot.errorSaveFirst": "Avval pasportni saqlang.",

    // App auth & status
    "app.auth.loggedIn": "Kirgansiz",
    "app.auth.logout": "Chiqish",
    "app.auth.asUser": "sifatida kirdingiz",
    "app.status.signIn": "Telegram orqali kiring",
    "app.status.saved": "Saqlangan",
    "app.status.loaded": "Yuklandi",
    "app.status.loggedIn": "Kirildi",

    // App save & errors
    "app.save": "Saqlash",
    "app.remove": "O'chirish",
    "app.save.saving": "Saqlanmoqda...",
    "app.save.success": "Saqlandi",
    "app.error.signInFirst": "Avval Telegram orqali kiring.",
    "app.error.requiredFields": "Biznes nomi, auditoriya va taklif kerak.",
    "app.error.pricingRequired": "Kamida bitta narx qo'shing.",
    "app.error.dbMigration": "Ma'lumotlar bazasi yangilanmagan. Administratorga xabar bering yoki keyinroq qayta urinib ko'ring.",
    "app.error.requestFailed": "So'rov bajarilmadi.",

    // Pilot modal
    "pilot.title": "Pilot kirishni bron qilish",
    "pilot.subtitle": "Converza DM Closer'ga erta kirish so'rovini yuboring. 24 soat ichida ko'rib chiqamiz.",
    "pilot.fullName": "To'liq ism *",
    "pilot.businessName": "Biznes nomi *",
    "pilot.challenge": "Asosiy muammo *",
    "pilot.phone": "Telefon raqami *",
    "pilot.telegram": "Telegram @username *",
    "pilot.hint": "Kirish uchun ishlatadigan @username bilan bir xil bo'lsin.",
    "pilot.submit": "So'rov yuborish",
    "pilot.submitting": "Yuborilmoqda...",
    "pilot.successTitle": "So'rov yuborildi",
    "pilot.successDesc": "Arizangizni ko'rib chiqamiz va tasdiqlangach Telegram orqali xabar beramiz. Keyin ushbu sahifada Kirish tugmasi orqali ish maydoningizga kiring.",
    "pilot.error.messageMin": "Muammoni kamida 30 belgida tasvirlab bering.",
    "pilot.error.phone": "To'g'ri telefon raqamini kiriting (masalan, +998901234567).",
    "pilot.error.username": "Telegram @username kiriting.",
    "pilot.close": "Yopish",

    // Auth modal
    "auth.title": "Telegram orqali kirish",
    "auth.subtitle": "Faqat tasdiqlangan hisoblar uchun. Kirish so'rovidagi @username bilan kiriting.",
    "auth.hint": "Tugma ko'rinmasa, BotFather'da domenni tekshiring.",
    "auth.signingIn": "Kirish...",
    "auth.error.loadFailed": "Telegram kirish yuklanmadi. Keyinroq qayta urinib ko'ring.",
    "auth.error.failed": "Kirish amalga oshmadi.",

    // Admin
    "admin.title": "Converza Admin",
    "admin.sub": "Foydalanuvchi kirish so'rovlarini tasdiqlang yoki rad eting. Telegram botda ham: /admin, /pending, /approve, /reject.",
    "admin.loginPrompt": "Admin sifatida Telegram orqali kiring:",
    "admin.logout": "Chiqish",
    "admin.tab.pending": "Kutilmoqda",
    "admin.tab.approved": "Tasdiqlangan",
    "admin.tab.rejected": "Rad etilgan",
    "admin.tab.all": "Barchasi",
    "admin.refresh": "Yangilash",
    "admin.loading": "Yuklanmoqda...",
    "admin.empty": "So'rovlar yo'q.",
    "admin.field.phone": "Telefon",
    "admin.field.telegram": "Telegram",
    "admin.field.submitted": "Yuborilgan",
    "admin.field.status": "Holat",
    "admin.painPoint": "Muammo / og'riq nuqtasi:",
    "admin.reviewNote": "Admin izohi:",
    "admin.notePlaceholder": "Izoh (ixtiyoriy)",
    "admin.approve": "Tasdiqlash",
    "admin.reject": "Rad etish",
    "admin.error.notAdmin": "Bu hisob admin ro'yxatida emas. ADMIN_TELEGRAM_IDS ni tekshiring.",

    // Common
    "common.save": "Saqlash",
    "common.close": "Yopish",
    "common.cancelAnytime": "Istalgan vaqtda bekor qilish"
  },

  ru: {
    // Nav
    "nav.signIn": "Войти",
    "nav.bookPilot": "Записаться на пилот",
    "nav.infrastructure": "Инфраструктура",
    "nav.protocol": "Протокол",
    "nav.capabilities": "Возможности",

    // Landing hero
    "landing.hero.pill": "Система онлайн: 24/7 DM",
    "landing.hero.title1": "Замените",
    "landing.hero.title2": "ночную смену.",
    "landing.hero.sub": "Автоматизируйте продажи в Telegram. Отвечайте лидам, отправляйте счета Click и закрывайте сделки — без операторов и без пропущенных сообщений после рабочего дня. Управление человеком не требуется.",
    "landing.hero.cta": "Записаться на пилот",
    "landing.hero.checkCancel": "Отмена в любой момент",
    "landing.hero.checkData": "Ваши данные остаются у вас",
    "landing.hero.nodeLabel": "Узел 04 / Очередь DM",

    // Landing features
    "landing.features.heading": "Алгоритмы не пропускают ночные сообщения.",
    "landing.features.card1Tag": "Компонент // 01",
    "landing.features.card1Title": "Разверните автономный DM closer в Telegram Business.",
    "landing.features.card1Desc": "Подключите бизнес-аккаунт — Converza возьмёт на себя входящие продажи на основе вашего бренд-паспорта.",
    "landing.features.card2Tag": "Компонент // 02",
    "landing.features.card2Title": "Отвечайте каждому лиду за секунды, круглосуточно.",
    "landing.features.card2Desc": "Загрузите цены, FAQ и тон общения — получайте выверенные ответы в стиле бренда, пока вы спите.",
    "landing.features.card3Tag": "Компонент // 03",
    "landing.features.card3Title": "Уберите человеческие задержки и расходы на операторов.",
    "landing.features.card3Desc": "Забудьте про смены. Автоматические follow-up и ссылки Click запускаются по вашему расписанию.",
    "landing.features.terminalLive": "LIVE FEED",
    "landing.features.deploySchedule": "Запустить расписание",

    // Landing philosophy
    "landing.philosophy.lead": "Большинство узбекских бизнесов сосредоточены на:",
    "landing.philosophy.leadEm": "ручных ответах на каждый Telegram DM.",
    "landing.philosophy.focusLabel": "Мы сосредоточены на:",
    "landing.philosophy.focusText": "автономном закрытии.",

    // Landing protocol
    "landing.protocol.heading": "Протокол развёртывания.",
    "landing.protocol.phase1Code": "SYSTEM.PHASE_01",
    "landing.protocol.phase1Title": "Определить бренд-паспорт",
    "landing.protocol.phase1Desc": "Загрузите логотипы, цены, FAQ и тон. DM closer построит математическую модель бренда и привяжет её к каждому ответу.",
    "landing.protocol.phase2Code": "SYSTEM.PHASE_02",
    "landing.protocol.phase2Title": "Проверка в терминале",
    "landing.protocol.phase2Desc": "Настройте правила DM Closer в рабочем пространстве. Утвердите шаблоны ответов, тарифы оплаты и обработчики возражений.",
    "landing.protocol.phase3Code": "SYSTEM.PHASE_03",
    "landing.protocol.phase3Title": "Развёртывание в Telegram",
    "landing.protocol.phase3Desc": "Подключите Telegram Business через @ConverzaSales_bot. Утверждённые ответы и счета Click идут автоматически.",

    // Landing pilot CTA
    "landing.pilot.badge": "Пилот Q3",
    "landing.pilot.title": "Перестаньте терять лидов, пока вы спите.",
    "landing.pilot.desc": "Открываем Q3 onboarding для Telegram-first бизнесов в Узбекистане и СНГ. Без проб и ошибок — протокол закрывает сделки за вас.",
    "landing.pilot.cta": "Забронировать место",
    "landing.pilot.footnote": "Отмена в любой момент",

    // Landing footer
    "landing.footer.status": "Система работает",

    // Landing shuffle cards
    "landing.shuffle.card1": "Узел 01: Бренд-паспорт",
    "landing.shuffle.card2": "Узел 08: Движок ответов DM",
    "landing.shuffle.card3": "Узел 19: Платежи Click",
    "landing.shuffle.statusActive": "АКТИВЕН",
    "landing.shuffle.statusSyncing": "СИНХР.",
    "landing.shuffle.statusReady": "ГОТОВ",

    // App nav
    "app.nav.dmCloser": "DM Closer",
    "app.nav.copilot": "Co-Pilot",

    // App passport
    "app.passport.title": "Бренд-паспорт",
    "app.passport.subtitle": "Заполните для работы DM Closer.",
    "app.passport.proofTitle": "1-я неделя",
    "app.passport.proofDesc": "Ответы на ночные сообщения, доведение до оплаты.",
    "app.passport.brandInfo": "Данные бренда",

    // App metrics
    "app.metrics.brand": "Поля бренда",
    "app.metrics.pricing": "Тарифы",
    "app.metrics.faq": "FAQ",
    "app.metrics.objections": "Возражения",

    // App connection
    "app.connection.title": "Telegram Business",
    "app.connection.desc": "DM Closer отвечает через ваш бизнес-аккаунт.",
    "app.connection.checking": "Проверка...",
    "app.connection.active": "Бизнес-подключение активно",
    "app.connection.inactive": "Бизнес-подключение отсутствует",
    "app.connection.subChecking": "Подписка: проверка...",
    "app.connection.subActive": "Подписка Converza активна",
    "app.connection.subInactive": "Нет подписки — @ConverzaApp_bot /subscribe",
    "app.connection.payChecking": "Click клиентов: проверка...",
    "app.connection.payActive": "Click для клиентов включён",
    "app.connection.payInactive": "Click для клиентов выключен (необязательно)",
    "app.connection.salesBotHint": "Sales bot: Настройки → Business → Chatbots →",
    "app.connection.subscribeHint": "Подписка Converza: /subscribe в @ConverzaApp_bot",
    "app.connection.statusFailed": "Не удалось загрузить статус",
    "app.connection.subUnknown": "Статус подписки неизвестен",
    "app.connection.payUnknown": "Статус Click неизвестен",

    // App PDF
    "app.pdf.title": "Заполнение из PDF",
    "app.pdf.subtitle": "Загрузите документ — паспорт создастся автоматически.",
    "app.pdf.drop": "Перетащите PDF сюда или",
    "app.pdf.browse": "выберите",
    "app.pdf.clear": "Очистить",
    "app.pdf.generate": "Создать из PDF",
    "app.pdf.analyzing": "док. анализируется... ⏳",
    "app.pdf.success": "PDF обработано. Проверьте и сохраните.",
    "app.pdf.errorPrefix": "Ошибка:",

    // App form labels
    "app.passport.formTitle": "Данные бренда",
    "app.passport.brandName": "Название бизнеса",
    "app.passport.industry": "Отрасль",
    "app.passport.location": "Регион",
    "app.passport.tone": "Тон общения",
    "app.passport.coreOffer": "Основное предложение",
    "app.passport.targetAudience": "Целевая аудитория",
    "app.passport.rawNotes": "Заметки для closer",
    "app.passport.pricingLabel": "Тарифы (для Click)",
    "app.passport.addPricing": "Добавить тариф",
    "app.passport.faqLabel": "FAQ",
    "app.passport.addFaq": "Добавить вопрос-ответ",
    "app.passport.objectionsLabel": "Частые возражения",
    "app.passport.addObjection": "Добавить возражение",
    "app.passport.orgNotice": "DM Closer и Co-Pilot используют этот паспорт.",
    "app.passport.orgNotLoggedIn": "не выполнен вход",
    "app.passport.salesBot": "Sales bot (Business DM)",
    "app.passport.clickToken": "Click token (необязательно)",
    "app.passport.clickTokenHint": "С вашим Click provider token клиентам отправляются ссылки на оплату. Без token DM Closer отвечает только текстом.",

    // App tone options
    "app.tone.friendly": "Дружелюбный, надёжный и лаконичный",
    "app.tone.professional": "Профессиональный и прямой",
    "app.tone.warm": "Тёплый и консультативный",

    // App placeholders
    "app.placeholder.brandName": "Converza",
    "app.placeholder.industry": "Автоматизация продаж в Telegram",
    "app.placeholder.coreOffer": "Продаём простой DM Closer, чтобы бизнес не терял клиентов после рабочего дня.",
    "app.placeholder.audience": "Малый бизнес в Узбекистане, продающий через Telegram и теряющий лидов ночью.",
    "app.placeholder.rawNotes": "Возвраты, доставка, запрещённые темы.",
    "app.placeholder.tier": "Telegram Pro",
    "app.placeholder.price": "$30 или 375000 сум",
    "app.placeholder.features": "ответы на входящие, отправка счетов",
    "app.placeholder.faqQ": "Работает ночью?",
    "app.placeholder.faqA": "Да, closer может отвечать 24/7.",
    "app.placeholder.objection": "Слишком дорого",
    "app.placeholder.response": "Окупается одной возвращённой сделкой.",
    "app.placeholder.clickToken": "BotFather → Payments → Click",

    // App copilot
    "app.copilot.title": "Co-Pilot",
    "app.copilot.subtitle": "Стратегия и тексты — на основе вашего бренд-паспорта.",
    "app.copilot.ready": "Готово",
    "app.copilot.loadedDesc": "Сохранённый паспорт загружен.",
    "app.copilot.welcome": "Пишите на узбекском, русском или английском — помогу со стратегией, текстами, возражениями или контент-планом.",
    "app.copilot.placeholder": "Напишите Co-Pilot...",
    "app.copilot.send": "Отправить",
    "app.copilot.errorSignIn": "Сначала войдите через Telegram.",
    "app.copilot.errorSaveFirst": "Сначала сохраните паспорт.",

    // App auth & status
    "app.auth.loggedIn": "Вы вошли",
    "app.auth.logout": "Выйти",
    "app.auth.asUser": "вошли как",
    "app.status.signIn": "Войдите через Telegram",
    "app.status.saved": "Сохранено",
    "app.status.loaded": "Загружено",
    "app.status.loggedIn": "Вход выполнен",

    // App save & errors
    "app.save": "Сохранить",
    "app.remove": "Удалить",
    "app.save.saving": "Сохранение...",
    "app.save.success": "Сохранено",
    "app.error.signInFirst": "Сначала войдите через Telegram.",
    "app.error.requiredFields": "Нужны название, аудитория и предложение.",
    "app.error.pricingRequired": "Добавьте хотя бы один тариф.",
    "app.error.dbMigration": "База данных не обновлена. Сообщите администратору или попробуйте позже.",
    "app.error.requestFailed": "Запрос не выполнен.",

    // Pilot modal
    "pilot.title": "Запись на пилот",
    "pilot.subtitle": "Запросите ранний доступ к Converza DM Closer. Рассмотрим за 24 часа.",
    "pilot.fullName": "Полное имя *",
    "pilot.businessName": "Название бизнеса *",
    "pilot.challenge": "Основная проблема *",
    "pilot.phone": "Номер телефона *",
    "pilot.telegram": "Telegram @username *",
    "pilot.hint": "Используйте тот же @username, что и для входа.",
    "pilot.submit": "Отправить заявку",
    "pilot.submitting": "Отправка...",
    "pilot.successTitle": "Заявка отправлена",
    "pilot.successDesc": "Мы рассмотрим заявку и уведомим в Telegram после одобрения. Затем нажмите Войти на этой странице для доступа к workspace.",
    "pilot.error.messageMin": "Опишите проблему минимум в 30 символах.",
    "pilot.error.phone": "Введите корректный номер (например, +998901234567).",
    "pilot.error.username": "Введите Telegram @username.",
    "pilot.close": "Закрыть",

    // Auth modal
    "auth.title": "Вход через Telegram",
    "auth.subtitle": "Только для одобренных аккаунтов. Используйте @username из заявки на доступ.",
    "auth.hint": "Если кнопка не появилась, проверьте домен в BotFather.",
    "auth.signingIn": "Вход...",
    "auth.error.loadFailed": "Не удалось загрузить вход через Telegram. Попробуйте позже.",
    "auth.error.failed": "Вход не выполнен.",

    // Admin
    "admin.title": "Converza Admin",
    "admin.sub": "Одобряйте или отклоняйте заявки на доступ. В Telegram-боте: /admin, /pending, /approve, /reject.",
    "admin.loginPrompt": "Войдите как admin через Telegram:",
    "admin.logout": "Выйти",
    "admin.tab.pending": "Ожидают",
    "admin.tab.approved": "Одобрены",
    "admin.tab.rejected": "Отклонены",
    "admin.tab.all": "Все",
    "admin.refresh": "Обновить",
    "admin.loading": "Загрузка...",
    "admin.empty": "Заявок нет.",
    "admin.field.phone": "Телефон",
    "admin.field.telegram": "Telegram",
    "admin.field.submitted": "Отправлено",
    "admin.field.status": "Статус",
    "admin.painPoint": "Проблема / боль:",
    "admin.reviewNote": "Комментарий admin:",
    "admin.notePlaceholder": "Комментарий (необязательно)",
    "admin.approve": "Одобрить",
    "admin.reject": "Отклонить",
    "admin.error.notAdmin": "Этот аккаунт не в списке admin. Проверьте ADMIN_TELEGRAM_IDS.",

    // Common
    "common.save": "Сохранить",
    "common.close": "Закрыть",
    "common.cancelAnytime": "Отмена в любой момент"
  },

  en: {
    // Nav
    "nav.signIn": "Sign in",
    "nav.bookPilot": "Book Pilot",
    "nav.infrastructure": "Infrastructure",
    "nav.protocol": "Protocol",
    "nav.capabilities": "Capabilities",

    // Landing hero
    "landing.hero.pill": "System Online: 24/7 DM",
    "landing.hero.title1": "Replace the",
    "landing.hero.title2": "Night Shift.",
    "landing.hero.sub": "Automate Telegram sales conversations for your business. Reply to leads, send Click invoices, and close deals — without hiring operators or missing messages after hours. No human management required.",
    "landing.hero.cta": "Book Your Pilot",
    "landing.hero.checkCancel": "Cancel anytime",
    "landing.hero.checkData": "Keep your data",
    "landing.hero.nodeLabel": "Node 04 / DM Queue",

    // Landing features
    "landing.features.heading": "Algorithms don't miss midnight messages.",
    "landing.features.card1Tag": "Component // 01",
    "landing.features.card1Title": "Deploy an autonomous DM closer on Telegram Business.",
    "landing.features.card1Desc": "Connect your business account and let Converza handle inbound sales conversations trained on your brand passport.",
    "landing.features.card2Tag": "Component // 02",
    "landing.features.card2Title": "Reply to every lead in seconds, around the clock.",
    "landing.features.card2Desc": "Feed the system your pricing, FAQ, and tone — receive polished, on-brand responses while you sleep.",
    "landing.features.card3Tag": "Component // 03",
    "landing.features.card3Title": "Eliminate human latency & operator costs.",
    "landing.features.card3Desc": "Skip the shift schedules. Automated follow-ups and Click payment links deploy on your schedule.",
    "landing.features.terminalLive": "LIVE FEED",
    "landing.features.deploySchedule": "Deploy Schedule",

    // Landing philosophy
    "landing.philosophy.lead": "Most Uzbek businesses focus on:",
    "landing.philosophy.leadEm": "manually answering every Telegram DM.",
    "landing.philosophy.focusLabel": "We focus on:",
    "landing.philosophy.focusText": "autonomous closing.",

    // Landing protocol
    "landing.protocol.heading": "The Deployment Protocol.",
    "landing.protocol.phase1Code": "SYSTEM.PHASE_01",
    "landing.protocol.phase1Title": "Define Brand Passport",
    "landing.protocol.phase1Desc": "Upload logos, pricing, FAQ, and tone. The DM closer builds a mathematical model of your brand and binds it to every reply.",
    "landing.protocol.phase2Code": "SYSTEM.PHASE_02",
    "landing.protocol.phase2Title": "Review Terminal",
    "landing.protocol.phase2Desc": "Configure your DM Closer rules in your workspace. Approve response templates, set payment tiers, and tune objection handlers before going live.",
    "landing.protocol.phase3Code": "SYSTEM.PHASE_03",
    "landing.protocol.phase3Title": "Telegram Deploy",
    "landing.protocol.phase3Desc": "Connect Telegram Business via @ConverzaSales_bot. Approved replies and Click invoices flow automatically through your business account.",

    // Landing pilot CTA
    "landing.pilot.badge": "Q3 Pilot Access",
    "landing.pilot.title": "Stop losing leads while you sleep.",
    "landing.pilot.desc": "We're opening Q3 onboarding for Telegram-first businesses in Uzbekistan and the CIS. Skip the trial and error — let the protocol close for you.",
    "landing.pilot.cta": "Secure Your Spot",
    "landing.pilot.footnote": "Cancel anytime",

    // Landing footer
    "landing.footer.status": "System Operational",

    // Landing shuffle cards
    "landing.shuffle.card1": "Node 01: Brand Passport",
    "landing.shuffle.card2": "Node 08: DM Response Engine",
    "landing.shuffle.card3": "Node 19: Click Payments",
    "landing.shuffle.statusActive": "ACTIVE",
    "landing.shuffle.statusSyncing": "SYNCHING",
    "landing.shuffle.statusReady": "READY",

    // App nav
    "app.nav.dmCloser": "DM Closer",
    "app.nav.copilot": "Co-Pilot",

    // App passport
    "app.passport.title": "Brand Passport",
    "app.passport.subtitle": "Fill this in for DM Closer to work.",
    "app.passport.proofTitle": "Week 1",
    "app.passport.proofDesc": "Reply to after-hours messages, drive to payment.",
    "app.passport.brandInfo": "Brand details",

    // App metrics
    "app.metrics.brand": "Brand fields",
    "app.metrics.pricing": "Pricing tiers",
    "app.metrics.faq": "FAQ",
    "app.metrics.objections": "Objections",

    // App connection
    "app.connection.title": "Telegram Business",
    "app.connection.desc": "DM Closer replies through your business account.",
    "app.connection.checking": "Checking...",
    "app.connection.active": "Business connection active",
    "app.connection.inactive": "No business connection",
    "app.connection.subChecking": "Subscription: checking...",
    "app.connection.subActive": "Converza subscription active",
    "app.connection.subInactive": "No subscription — @ConverzaApp_bot /subscribe",
    "app.connection.payChecking": "Customer Click: checking...",
    "app.connection.payActive": "Customer Click payments enabled",
    "app.connection.payInactive": "Customer Click off (optional)",
    "app.connection.salesBotHint": "Sales bot: Settings → Business → Chatbots →",
    "app.connection.subscribeHint": "Converza subscription: /subscribe in @ConverzaApp_bot",
    "app.connection.statusFailed": "Could not load status",
    "app.connection.subUnknown": "Subscription status unknown",
    "app.connection.payUnknown": "Click status unknown",

    // App PDF
    "app.pdf.title": "Fill from PDF",
    "app.pdf.subtitle": "Upload a document — the passport is generated automatically.",
    "app.pdf.drop": "Drop PDF files here or",
    "app.pdf.browse": "browse",
    "app.pdf.clear": "Clear",
    "app.pdf.generate": "Generate from PDF",
    "app.pdf.analyzing": "document(s) analyzing... ⏳",
    "app.pdf.success": "PDF(s) processed. Review and save.",
    "app.pdf.errorPrefix": "Error:",

    // App form labels
    "app.passport.formTitle": "Brand details",
    "app.passport.brandName": "Business name",
    "app.passport.industry": "Industry",
    "app.passport.location": "Location",
    "app.passport.tone": "Communication tone",
    "app.passport.coreOffer": "Core offer",
    "app.passport.targetAudience": "Target audience",
    "app.passport.rawNotes": "Closer notes",
    "app.passport.pricingLabel": "Pricing (for Click)",
    "app.passport.addPricing": "Add pricing tier",
    "app.passport.faqLabel": "FAQ",
    "app.passport.addFaq": "Add Q&A",
    "app.passport.objectionsLabel": "Common objections",
    "app.passport.addObjection": "Add objection",
    "app.passport.orgNotice": "DM Closer and Co-Pilot use this passport.",
    "app.passport.orgNotLoggedIn": "not signed in",
    "app.passport.salesBot": "Sales bot (Business DM)",
    "app.passport.clickToken": "Click token (optional)",
    "app.passport.clickTokenHint": "With your Click provider token, customers receive payment links. Without it, DM Closer replies with text only.",

    // App tone options
    "app.tone.friendly": "Friendly, trustworthy, and concise",
    "app.tone.professional": "Professional and direct",
    "app.tone.warm": "Warm and consultative",

    // App placeholders
    "app.placeholder.brandName": "Converza",
    "app.placeholder.industry": "Telegram sales automation",
    "app.placeholder.coreOffer": "We sell a simple DM Closer so businesses don't lose after-hours customers.",
    "app.placeholder.audience": "Uzbek small businesses selling via Telegram and losing leads after hours.",
    "app.placeholder.rawNotes": "Returns, delivery, off-limit topics.",
    "app.placeholder.tier": "Telegram Pro",
    "app.placeholder.price": "$30 or 375000 UZS",
    "app.placeholder.features": "reply to inbound, send invoices",
    "app.placeholder.faqQ": "Does it work at night?",
    "app.placeholder.faqA": "Yes, the closer can reply 24/7.",
    "app.placeholder.objection": "Too expensive",
    "app.placeholder.response": "Pays for itself with one recovered deal.",
    "app.placeholder.clickToken": "BotFather → Payments → Click",

    // App copilot
    "app.copilot.title": "Co-Pilot",
    "app.copilot.subtitle": "Strategy and copy — based on your brand passport.",
    "app.copilot.ready": "Ready",
    "app.copilot.loadedDesc": "Saved passport loaded.",
    "app.copilot.welcome": "Write in Uzbek, Russian, or English — I can help with strategy, copy, objections, or a content plan.",
    "app.copilot.placeholder": "Message Co-Pilot...",
    "app.copilot.send": "Send",
    "app.copilot.errorSignIn": "Sign in with Telegram first.",
    "app.copilot.errorSaveFirst": "Save your passport first.",

    // App auth & status
    "app.auth.loggedIn": "Signed in",
    "app.auth.logout": "Sign out",
    "app.auth.asUser": "signed in as",
    "app.status.signIn": "Sign in with Telegram",
    "app.status.saved": "Saved",
    "app.status.loaded": "Loaded",
    "app.status.loggedIn": "Signed in",

    // App save & errors
    "app.save": "Save",
    "app.remove": "Remove",
    "app.save.saving": "Saving...",
    "app.save.success": "Saved",
    "app.error.signInFirst": "Sign in with Telegram first.",
    "app.error.requiredFields": "Business name, audience, and offer are required.",
    "app.error.pricingRequired": "Add at least one pricing tier.",
    "app.error.dbMigration": "Database is out of date. Contact an administrator or try again later.",
    "app.error.requestFailed": "Request failed.",

    // Pilot modal
    "pilot.title": "Book Pilot Access",
    "pilot.subtitle": "Request early access to Converza DM Closer. We'll review and approve within 24 hours.",
    "pilot.fullName": "Full name *",
    "pilot.businessName": "Business name *",
    "pilot.challenge": "Main challenge *",
    "pilot.phone": "Phone number *",
    "pilot.telegram": "Telegram @username *",
    "pilot.hint": "Use the same @username you'll log in with.",
    "pilot.submit": "Submit Request",
    "pilot.submitting": "Submitting...",
    "pilot.successTitle": "Request submitted",
    "pilot.successDesc": "We'll review your application and notify you via Telegram once approved. Then use Sign in on this page to access your workspace.",
    "pilot.error.messageMin": "Describe your challenge in at least 30 characters.",
    "pilot.error.phone": "Enter a valid phone number (e.g. +998901234567).",
    "pilot.error.username": "Enter your Telegram @username.",
    "pilot.close": "Close",

    // Auth modal
    "auth.title": "Sign in with Telegram",
    "auth.subtitle": "For approved accounts only. Use the same @username from your access request.",
    "auth.hint": "If the button does not appear, check the domain in BotFather.",
    "auth.signingIn": "Signing in...",
    "auth.error.loadFailed": "Could not load Telegram sign-in. Try again later.",
    "auth.error.failed": "Sign in failed.",

    // Admin
    "admin.title": "Converza Admin",
    "admin.sub": "Approve or reject user access requests. In the Telegram bot: /admin, /pending, /approve, /reject.",
    "admin.loginPrompt": "Sign in as admin via Telegram:",
    "admin.logout": "Sign out",
    "admin.tab.pending": "Pending",
    "admin.tab.approved": "Approved",
    "admin.tab.rejected": "Rejected",
    "admin.tab.all": "All",
    "admin.refresh": "Refresh",
    "admin.loading": "Loading...",
    "admin.empty": "No requests.",
    "admin.field.phone": "Phone",
    "admin.field.telegram": "Telegram",
    "admin.field.submitted": "Submitted",
    "admin.field.status": "Status",
    "admin.painPoint": "Challenge / pain point:",
    "admin.reviewNote": "Admin note:",
    "admin.notePlaceholder": "Note (optional)",
    "admin.approve": "Approve",
    "admin.reject": "Reject",
    "admin.error.notAdmin": "This account is not on the admin list. Check ADMIN_TELEGRAM_IDS.",

    // Common
    "common.save": "Save",
    "common.close": "Close",
    "common.cancelAnytime": "Cancel anytime"
  }
};
