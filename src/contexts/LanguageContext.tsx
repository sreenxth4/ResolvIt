import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "en" | "hi" | "te";

export const languageLabels: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
};

// ─── Translation keys ───
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Auth page - branding
    "brand.tagline": "From complaints to accountability — turning public voices into measurable action.",
    "brand.feature1": "Report civic issues with precise location mapping",
    "brand.feature2": "Track resolution progress in real-time",
    "brand.feature3": "AI-powered priority scoring and duplicate detection",

    // Auth page - general
    "auth.welcome": "Welcome",
    "auth.subtitle": "Sign in to your account or create a new one",
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.authority": "Authority",
    "auth.admin": "Admin",
    "auth.signingIn": "Signing in...",
    "auth.creatingAccount": "Creating account...",

    // Login form
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign In",
    "login.failed": "Login failed",

    // Signup form
    "signup.name": "Full Name",
    "signup.email": "Email",
    "signup.password": "Password",
    "signup.submit": "Create Account",
    "signup.failed": "Signup failed",
    "signup.checkEmail": "Check your email",
    "signup.confirmLink": "We sent you a confirmation link.",
    "signup.passwordShort": "Password too short",
    "signup.passwordMin": "Must be at least 6 characters",

    // Authority login
    "authority.info": "Authority login is for government officials only. Use the email and password assigned by administrators.",
    "authority.email": "Email",
    "authority.password": "Password",
    "authority.emailPlaceholder": "authority email",
    "authority.passwordPlaceholder": "Enter password",
    "authority.submit": "Authority Sign In",

    // Admin login
    "admin.info": "Enter the admin password to access the admin dashboard.",
    "admin.password": "Admin Password",
    "admin.passwordPlaceholder": "Enter admin password",
    "admin.submit": "Admin Sign In",
    "admin.denied": "Access denied",
    "admin.invalidPwd": "Invalid admin password",
    "admin.failed": "Admin login failed",

    // Intent guard
    "intent.denied": "Access denied",
    "intent.mismatch": "These credentials belong to a {role} account, not {intent}.",

    // Citizen pages
    "nav.dashboard": "Dashboard",
    "nav.submit": "Submit Issue",
    "nav.myIssues": "My Issues",
    "nav.leaderboard": "Leaderboard",
    "nav.signOut": "Sign Out",

    // Submit issue
    "submit.title": "Report a Civic Issue",
    "submit.issueTitle": "Issue Title",
    "submit.titlePlaceholder": "Brief description of the problem",
    "submit.description": "Detailed Description",
    "submit.descPlaceholder": "Provide as much detail as possible...",
    "submit.category": "Category",
    "submit.selectCategory": "Select category",
    "submit.severity": "Severity (1-5)",
    "submit.location": "Location",
    "submit.photo": "Photo",
    "submit.photoRequired": "Please upload a photo of the issue",
    "submit.locationRequired": "Please click on the map to set a location",
    "submit.categoryRequired": "Category required",
    "submit.submitting": "Analyzing & Submitting...",
    "submit.submitBtn": "Submit Issue",
    "submit.duplicate": "Similar issue found!",
    "submit.duplicateDesc": "Your report has been added to an existing issue. +10 civic points!",
    "submit.success": "Issue submitted!",
    "submit.successDesc": "Your report has been created. +10 civic points!",
    "submit.fallback": "Issue submitted",
    "submit.fallbackDesc": "Saved directly to database. Deploy edge functions to enable duplicate detection.",
    "submit.failed": "Submission failed",

    // Categories
    "cat.roads": "Roads & Transport",
    "cat.water": "Water Supply",
    "cat.electricity": "Electricity",
    "cat.sanitation": "Sanitation",
    "cat.public_safety": "Public Safety",
    "cat.parks": "Parks & Recreation",
    "cat.other": "Other",

    // Severity
    "sev.1": "Minor",
    "sev.2": "Low",
    "sev.3": "Moderate",
    "sev.4": "High",
    "sev.5": "Critical",

    // Location picker
    "loc.search": "Search for an address or place...",
    "loc.gps": "Use my current location",
    "loc.clickMap": "Search for an address, use GPS, or click on the map to select location",
    "loc.noResults": "No results found",
    "loc.searchFailed": "Search failed. Try again.",
    "loc.gpsUnsupported": "Geolocation not supported by your browser",
    "loc.gpsFailed": "Could not get your location. Check permissions.",

    // Dashboard
    "dashboard.welcome": "Welcome back, {name}",
    "dashboard.subtitle": "Your civic dashboard",
    "dashboard.reportIssue": "Report Issue",
    "dashboard.totalIssues": "Total Issues",
    "dashboard.inProgress": "In Progress",
    "dashboard.resolved": "Resolved",
    "dashboard.civicPoints": "Civic Points",
    "dashboard.escalatedWarning": "{count} of your issues have been escalated",
    "dashboard.recentIssues": "Recent Issues",
    "dashboard.noIssues": "No issues reported yet.",
    "dashboard.submitFirst": "Submit your first issue",

    // My Issues
    "myIssues.title": "My Issues",
    "myIssues.all": "All",
    "myIssues.open": "Open",
    "myIssues.inProgress": "In Progress",
    "myIssues.resolved": "Resolved",
    "myIssues.escalated": "Escalated",
    "myIssues.loading": "Loading issues...",
    "myIssues.noIssues": "No issues found.",

    // Leaderboard
    "leaderboard.title": "Civic Leaderboard",
    "leaderboard.yourPoints": "Your Points: {points}",
    "leaderboard.keepReporting": "Keep reporting issues to earn more!",
    "leaderboard.top10": "Top 10 Citizens",
    "leaderboard.rank": "Rank",
    "leaderboard.name": "Name",
    "leaderboard.points": "Points",
    "leaderboard.noData": "No data yet",

    // Issue Detail
    "issue.loading": "Loading...",
    "issue.notFound": "Issue not found.",
    "issue.upvotes": "Upvotes",
    "issue.reports": "{count} reports",
    "issue.statusTimeline": "Status Timeline",
    "issue.noStatusChanges": "No status changes yet",
    "issue.upvoteRemoved": "Upvote removed",
    "issue.upvoted": "Upvoted!",
    "issue.upvoteFailed": "Failed to upvote",

    // Status labels
    "status.open": "Open",
    "status.in_progress": "In Progress",
    "status.resolved": "Resolved",
    "status.escalated": "Escalated",

    // Priority labels
    "priority.low": "Low",
    "priority.medium": "Medium",
    "priority.high": "High",
    "priority.critical": "Critical",

    // Notifications
    "notif.title": "Notifications",
    "notif.markAllRead": "Mark all read",
    "notif.noNotifications": "No notifications yet",

    // Common
    "common.loading": "Loading...",
    "common.user": "User",

    // File upload
    "submit.fileTooLarge": "File too large",
    "submit.maxSize": "Max 5MB",
  },

  hi: {
    // Auth page - branding
    "brand.tagline": "शिकायतों से जवाबदेही तक — नागरिकों की आवाज़ को मापने योग्य कार्रवाई में बदलना।",
    "brand.feature1": "सटीक स्थान मानचित्रण के साथ नागरिक समस्याओं की रिपोर्ट करें",
    "brand.feature2": "वास्तविक समय में समाधान की प्रगति ट्रैक करें",
    "brand.feature3": "AI-संचालित प्राथमिकता स्कोरिंग और डुप्लिकेट पहचान",

    // Auth page - general
    "auth.welcome": "स्वागत है",
    "auth.subtitle": "अपने खाते में साइन इन करें या नया बनाएं",
    "auth.signIn": "साइन इन",
    "auth.signUp": "साइन अप",
    "auth.authority": "प्राधिकरण",
    "auth.admin": "एडमिन",
    "auth.signingIn": "साइन इन हो रहा है...",
    "auth.creatingAccount": "खाता बना रहे हैं...",

    // Login form
    "login.email": "ईमेल",
    "login.password": "पासवर्ड",
    "login.submit": "साइन इन करें",
    "login.failed": "लॉगिन विफल",

    // Signup form
    "signup.name": "पूरा नाम",
    "signup.email": "ईमेल",
    "signup.password": "पासवर्ड",
    "signup.submit": "खाता बनाएं",
    "signup.failed": "साइनअप विफल",
    "signup.checkEmail": "अपना ईमेल जांचें",
    "signup.confirmLink": "हमने आपको एक पुष्टिकरण लिंक भेजा है।",
    "signup.passwordShort": "पासवर्ड बहुत छोटा है",
    "signup.passwordMin": "कम से कम 6 अक्षर होने चाहिए",

    // Authority login
    "authority.info": "प्राधिकरण लॉगिन केवल सरकारी अधिकारियों के लिए है। प्रशासकों द्वारा दिए गए ईमेल और पासवर्ड का उपयोग करें।",
    "authority.email": "ईमेल",
    "authority.password": "पासवर्ड",
    "authority.emailPlaceholder": "प्राधिकरण ईमेल",
    "authority.passwordPlaceholder": "पासवर्ड दर्ज करें",
    "authority.submit": "प्राधिकरण साइन इन",

    // Admin login
    "admin.info": "एडमिन डैशबोर्ड तक पहुंचने के लिए एडमिन पासवर्ड दर्ज करें।",
    "admin.password": "एडमिन पासवर्ड",
    "admin.passwordPlaceholder": "एडमिन पासवर्ड दर्ज करें",
    "admin.submit": "एडमिन साइन इन",
    "admin.denied": "पहुंच अस्वीकृत",
    "admin.invalidPwd": "अमान्य एडमिन पासवर्ड",
    "admin.failed": "एडमिन लॉगिन विफल",

    // Intent guard
    "intent.denied": "पहुंच अस्वीकृत",
    "intent.mismatch": "ये क्रेडेंशियल {role} खाते के हैं, {intent} के नहीं।",

    // Citizen pages
    "nav.dashboard": "डैशबोर्ड",
    "nav.submit": "समस्या दर्ज करें",
    "nav.myIssues": "मेरी समस्याएं",
    "nav.leaderboard": "लीडरबोर्ड",
    "nav.signOut": "साइन आउट",

    // Submit issue
    "submit.title": "नागरिक समस्या की रिपोर्ट करें",
    "submit.issueTitle": "समस्या का शीर्षक",
    "submit.titlePlaceholder": "समस्या का संक्षिप्त विवरण",
    "submit.description": "विस्तृत विवरण",
    "submit.descPlaceholder": "जितना संभव हो उतना विवरण दें...",
    "submit.category": "श्रेणी",
    "submit.selectCategory": "श्रेणी चुनें",
    "submit.severity": "गंभीरता (1-5)",
    "submit.location": "स्थान",
    "submit.photo": "फोटो",
    "submit.photoRequired": "कृपया समस्या की एक फोटो अपलोड करें",
    "submit.locationRequired": "स्थान सेट करने के लिए कृपया मानचित्र पर क्लिक करें",
    "submit.categoryRequired": "श्रेणी आवश्यक है",
    "submit.submitting": "विश्लेषण और सबमिट हो रहा है...",
    "submit.submitBtn": "समस्या दर्ज करें",
    "submit.duplicate": "समान समस्या मिली!",
    "submit.duplicateDesc": "आपकी रिपोर्ट मौजूदा समस्या में जोड़ दी गई है। +10 नागरिक अंक!",
    "submit.success": "समस्या दर्ज हो गई!",
    "submit.successDesc": "आपकी रिपोर्ट बना दी गई है। +10 नागरिक अंक!",
    "submit.fallback": "समस्या दर्ज हो गई",
    "submit.fallbackDesc": "सीधे डेटाबेस में सहेजा गया।",
    "submit.failed": "सबमिशन विफल",

    // Categories
    "cat.roads": "सड़कें और परिवहन",
    "cat.water": "जल आपूर्ति",
    "cat.electricity": "बिजली",
    "cat.sanitation": "स्वच्छता",
    "cat.public_safety": "सार्वजनिक सुरक्षा",
    "cat.parks": "पार्क और मनोरंजन",
    "cat.other": "अन्य",

    // Severity
    "sev.1": "मामूली",
    "sev.2": "कम",
    "sev.3": "सामान्य",
    "sev.4": "उच्च",
    "sev.5": "गंभीर",

    // Location picker
    "loc.search": "पता या स्थान खोजें...",
    "loc.gps": "मेरा वर्तमान स्थान उपयोग करें",
    "loc.clickMap": "पता खोजें, GPS उपयोग करें, या स्थान चुनने के लिए मानचित्र पर क्लिक करें",
    "loc.noResults": "कोई परिणाम नहीं मिला",
    "loc.searchFailed": "खोज विफल। पुनः प्रयास करें।",
    "loc.gpsUnsupported": "आपका ब्राउज़र जियोलोकेशन का समर्थन नहीं करता",
    "loc.gpsFailed": "आपका स्थान प्राप्त नहीं हो सका। अनुमतियां जांचें।",

    // Dashboard
    "dashboard.welcome": "वापसी पर स्वागत, {name}",
    "dashboard.subtitle": "आपका नागरिक डैशबोर्ड",
    "dashboard.reportIssue": "समस्या दर्ज करें",
    "dashboard.totalIssues": "कुल समस्याएं",
    "dashboard.inProgress": "प्रगति में",
    "dashboard.resolved": "समाधान हुआ",
    "dashboard.civicPoints": "नागरिक अंक",
    "dashboard.escalatedWarning": "आपकी {count} समस्याएं बढ़ा दी गई हैं",
    "dashboard.recentIssues": "हाल की समस्याएं",
    "dashboard.noIssues": "अभी तक कोई समस्या दर्ज नहीं की गई।",
    "dashboard.submitFirst": "अपनी पहली समस्या दर्ज करें",

    // My Issues
    "myIssues.title": "मेरी समस्याएं",
    "myIssues.all": "सभी",
    "myIssues.open": "खुली",
    "myIssues.inProgress": "प्रगति में",
    "myIssues.resolved": "समाधान हुआ",
    "myIssues.escalated": "बढ़ाई गई",
    "myIssues.loading": "समस्याएं लोड हो रही हैं...",
    "myIssues.noIssues": "कोई समस्या नहीं मिली।",

    // Leaderboard
    "leaderboard.title": "नागरिक लीडरबोर्ड",
    "leaderboard.yourPoints": "आपके अंक: {points}",
    "leaderboard.keepReporting": "अधिक अंक कमाने के लिए समस्याएं दर्ज करते रहें!",
    "leaderboard.top10": "शीर्ष 10 नागरिक",
    "leaderboard.rank": "रैंक",
    "leaderboard.name": "नाम",
    "leaderboard.points": "अंक",
    "leaderboard.noData": "अभी तक कोई डेटा नहीं",

    // Issue Detail
    "issue.loading": "लोड हो रहा है...",
    "issue.notFound": "समस्या नहीं मिली।",
    "issue.upvotes": "अपवोट",
    "issue.reports": "{count} रिपोर्ट",
    "issue.statusTimeline": "स्थिति समयरेखा",
    "issue.noStatusChanges": "अभी तक कोई स्थिति परिवर्तन नहीं",
    "issue.upvoteRemoved": "अपवोट हटाया गया",
    "issue.upvoted": "अपवोट किया!",
    "issue.upvoteFailed": "अपवोट विफल",

    // Status labels
    "status.open": "खुली",
    "status.in_progress": "प्रगति में",
    "status.resolved": "समाधान हुआ",
    "status.escalated": "बढ़ाई गई",

    // Priority labels
    "priority.low": "कम",
    "priority.medium": "मध्यम",
    "priority.high": "उच्च",
    "priority.critical": "गंभीर",

    // Notifications
    "notif.title": "सूचनाएं",
    "notif.markAllRead": "सभी पढ़ी गई चिह्नित करें",
    "notif.noNotifications": "अभी तक कोई सूचना नहीं",

    // Common
    "common.loading": "लोड हो रहा है...",
    "common.user": "उपयोगकर्ता",

    // File upload
    "submit.fileTooLarge": "फाइल बहुत बड़ी है",
    "submit.maxSize": "अधिकतम 5MB",
  },

  te: {
    // Auth page - branding
    "brand.tagline": "ఫిర్యాదుల నుండి జవాబుదారీతనం వరకు — ప్రజల గొంతుకను కొలవగల చర్యగా మార్చడం.",
    "brand.feature1": "ఖచ్చితమైన లొకేషన్ మ్యాపింగ్‌తో పౌర సమస్యలను నివేదించండి",
    "brand.feature2": "పరిష్కార ప్రగతిని రియల్-టైమ్‌లో ట్రాక్ చేయండి",
    "brand.feature3": "AI-ఆధారిత ప్రాధాన్యత స్కోరింగ్ మరియు డూప్లికేట్ గుర్తింపు",

    // Auth page - general
    "auth.welcome": "స్వాగతం",
    "auth.subtitle": "మీ ఖాతాలో సైన్ ఇన్ చేయండి లేదా కొత్తది సృష్టించండి",
    "auth.signIn": "సైన్ ఇన్",
    "auth.signUp": "సైన్ అప్",
    "auth.authority": "అధికారి",
    "auth.admin": "అడ్మిన్",
    "auth.signingIn": "సైన్ ఇన్ అవుతోంది...",
    "auth.creatingAccount": "ఖాతా సృష్టిస్తోంది...",

    // Login form
    "login.email": "ఇమెయిల్",
    "login.password": "పాస్‌వర్డ్",
    "login.submit": "సైన్ ఇన్ చేయండి",
    "login.failed": "లాగిన్ విఫలమైంది",

    // Signup form
    "signup.name": "పూర్తి పేరు",
    "signup.email": "ఇమెయిల్",
    "signup.password": "పాస్‌వర్డ్",
    "signup.submit": "ఖాతా సృష్టించండి",
    "signup.failed": "సైనప్ విఫలమైంది",
    "signup.checkEmail": "మీ ఇమెయిల్ తనిఖీ చేయండి",
    "signup.confirmLink": "మేము మీకు నిర్ధారణ లింక్ పంపాము.",
    "signup.passwordShort": "పాస్‌వర్డ్ చాలా చిన్నది",
    "signup.passwordMin": "కనీసం 6 అక్షరాలు ఉండాలి",

    // Authority login
    "authority.info": "అధికారి లాగిన్ ప్రభుత్వ అధికారులకు మాత్రమే. నిర్వాహకులు ఇచ్చిన ఇమెయిల్ మరియు పాస్‌వర్డ్ ఉపయోగించండి.",
    "authority.email": "ఇమెయిల్",
    "authority.password": "పాస్‌వర్డ్",
    "authority.emailPlaceholder": "అధికారి ఇమెయిల్",
    "authority.passwordPlaceholder": "పాస్‌వర్డ్ నమోదు చేయండి",
    "authority.submit": "అధికారి సైన్ ఇన్",

    // Admin login
    "admin.info": "అడ్మిన్ డాష్‌బోర్డ్‌ను యాక్సెస్ చేయడానికి అడ్మిన్ పాస్‌వర్డ్ నమోదు చేయండి.",
    "admin.password": "అడ్మిన్ పాస్‌వర్డ్",
    "admin.passwordPlaceholder": "అడ్మిన్ పాస్‌వర్డ్ నమోదు చేయండి",
    "admin.submit": "అడ్మిన్ సైన్ ఇన్",
    "admin.denied": "ప్రాప్యత తిరస్కరించబడింది",
    "admin.invalidPwd": "చెల్లని అడ్మిన్ పాస్‌వర్డ్",
    "admin.failed": "అడ్మిన్ లాగిన్ విఫలమైంది",

    // Intent guard
    "intent.denied": "ప్రాప్యత తిరస్కరించబడింది",
    "intent.mismatch": "ఈ ఆధారాలు {role} ఖాతాకు చెందినవి, {intent} కాదు.",

    // Citizen pages
    "nav.dashboard": "డాష్‌బోర్డ్",
    "nav.submit": "సమస్య నమోదు",
    "nav.myIssues": "నా సమస్యలు",
    "nav.leaderboard": "లీడర్‌బోర్డ్",
    "nav.signOut": "సైన్ అవుట్",

    // Submit issue
    "submit.title": "పౌర సమస్యను నివేదించండి",
    "submit.issueTitle": "సమస్య శీర్షిక",
    "submit.titlePlaceholder": "సమస్య యొక్క సంక్షిప్త వివరణ",
    "submit.description": "వివరమైన వివరణ",
    "submit.descPlaceholder": "వీలైనంత ఎక్కువ వివరాలు అందించండి...",
    "submit.category": "వర్గం",
    "submit.selectCategory": "వర్గం ఎంచుకోండి",
    "submit.severity": "తీవ్రత (1-5)",
    "submit.location": "స్థానం",
    "submit.photo": "ఫోటో",
    "submit.photoRequired": "దయచేసి సమస్య యొక్క ఫోటో అప్‌లోడ్ చేయండి",
    "submit.locationRequired": "స్థానాన్ని సెట్ చేయడానికి మ్యాప్‌పై క్లిక్ చేయండి",
    "submit.categoryRequired": "వర్గం అవసరం",
    "submit.submitting": "విశ్లేషిస్తోంది & సమర్పిస్తోంది...",
    "submit.submitBtn": "సమస్య సమర్పించండి",
    "submit.duplicate": "ఇలాంటి సమస్య కనుగొనబడింది!",
    "submit.duplicateDesc": "మీ నివేదిక ఇప్పటికే ఉన్న సమస్యకు జోడించబడింది. +10 పౌర పాయింట్లు!",
    "submit.success": "సమస్య సమర్పించబడింది!",
    "submit.successDesc": "మీ నివేదిక సృష్టించబడింది. +10 పౌర పాయింట్లు!",
    "submit.fallback": "సమస్య సమర్పించబడింది",
    "submit.fallbackDesc": "డేటాబేస్‌లో నేరుగా సేవ్ చేయబడింది.",
    "submit.failed": "సమర్పణ విఫలమైంది",

    // Categories
    "cat.roads": "రోడ్లు & రవాణా",
    "cat.water": "నీటి సరఫరా",
    "cat.electricity": "విద్యుత్",
    "cat.sanitation": "పారిశుద్ధ్యం",
    "cat.public_safety": "ప్రజా భద్రత",
    "cat.parks": "పార్కులు & వినోదం",
    "cat.other": "ఇతర",

    // Severity
    "sev.1": "స్వల్పం",
    "sev.2": "తక్కువ",
    "sev.3": "మధ్యస్థం",
    "sev.4": "అధికం",
    "sev.5": "తీవ్రం",

    // Location picker
    "loc.search": "చిరునామా లేదా ప్రదేశం కోసం శోధించండి...",
    "loc.gps": "నా ప్రస్తుత స్థానాన్ని ఉపయోగించండి",
    "loc.clickMap": "చిరునామా శోధించండి, GPS ఉపయోగించండి, లేదా స్థానాన్ని ఎంచుకోవడానికి మ్యాప్‌పై క్లిక్ చేయండి",
    "loc.noResults": "ఫలితాలు కనుగొనబడలేదు",
    "loc.searchFailed": "శోధన విఫలమైంది. మళ్ళీ ప్రయత్నించండి.",
    "loc.gpsUnsupported": "మీ బ్రౌజర్ జియోలొకేషన్‌కు మద్దతు ఇవ్వదు",
    "loc.gpsFailed": "మీ స్థానం పొందలేకపోయాము. అనుమతులు తనిఖీ చేయండి.",

    // Dashboard
    "dashboard.welcome": "తిరిగి స్వాగతం, {name}",
    "dashboard.subtitle": "మీ పౌర డాష్‌బోర్డ్",
    "dashboard.reportIssue": "సమస్య నివేదించండి",
    "dashboard.totalIssues": "మొత్తం సమస్యలు",
    "dashboard.inProgress": "ప్రగతిలో ఉంది",
    "dashboard.resolved": "పరిష్కరించబడింది",
    "dashboard.civicPoints": "పౌర పాయింట్లు",
    "dashboard.escalatedWarning": "మీ {count} సమస్యలు ఎస్కలేట్ చేయబడ్డాయి",
    "dashboard.recentIssues": "ఇటీవలి సమస్యలు",
    "dashboard.noIssues": "ఇంకా సమస్యలు నివేదించబడలేదు.",
    "dashboard.submitFirst": "మీ మొదటి సమస్యను సమర్పించండి",

    // My Issues
    "myIssues.title": "నా సమస్యలు",
    "myIssues.all": "అన్నీ",
    "myIssues.open": "తెరిచినవి",
    "myIssues.inProgress": "ప్రగతిలో ఉన్నవి",
    "myIssues.resolved": "పరిష్కరించబడినవి",
    "myIssues.escalated": "ఎస్కలేట్ చేయబడినవి",
    "myIssues.loading": "సమస్యలు లోడ్ అవుతున్నాయి...",
    "myIssues.noIssues": "సమస్యలు కనుగొనబడలేదు.",

    // Leaderboard
    "leaderboard.title": "పౌర లీడర్‌బోర్డ్",
    "leaderboard.yourPoints": "మీ పాయింట్లు: {points}",
    "leaderboard.keepReporting": "ఎక్కువ పాయింట్లు సంపాదించడానికి సమస్యలు నివేదిస్తూ ఉండండి!",
    "leaderboard.top10": "టాప్ 10 పౌరులు",
    "leaderboard.rank": "ర్యాంక్",
    "leaderboard.name": "పేరు",
    "leaderboard.points": "పాయింట్లు",
    "leaderboard.noData": "ఇంకా డేటా లేదు",

    // Issue Detail
    "issue.loading": "లోడ్ అవుతోంది...",
    "issue.notFound": "సమస్య కనుగొనబడలేదు.",
    "issue.upvotes": "అప్‌వోట్‌లు",
    "issue.reports": "{count} నివేదికలు",
    "issue.statusTimeline": "స్థితి టైమ్‌లైన్",
    "issue.noStatusChanges": "ఇంకా స్థితి మార్పులు లేవు",
    "issue.upvoteRemoved": "అప్‌వోట్ తీసివేయబడింది",
    "issue.upvoted": "అప్‌వోట్ చేయబడింది!",
    "issue.upvoteFailed": "అప్‌వోట్ విఫలమైంది",

    // Status labels
    "status.open": "తెరిచినది",
    "status.in_progress": "ప్రగతిలో ఉంది",
    "status.resolved": "పరిష్కరించబడింది",
    "status.escalated": "ఎస్కలేట్ చేయబడింది",

    // Priority labels
    "priority.low": "తక్కువ",
    "priority.medium": "మధ్యస్థం",
    "priority.high": "అధికం",
    "priority.critical": "తీవ్రం",

    // Notifications
    "notif.title": "నోటిఫికేషన్‌లు",
    "notif.markAllRead": "అన్నీ చదివినట్లు గుర్తించండి",
    "notif.noNotifications": "ఇంకా నోటిఫికేషన్‌లు లేవు",

    // Common
    "common.loading": "లోడ్ అవుతోంది...",
    "common.user": "వినియోగదారు",

    // File upload
    "submit.fileTooLarge": "ఫైల్ చాలా పెద్దది",
    "submit.maxSize": "గరిష్టంగా 5MB",
  },
};

// ─── Context ───
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("resolvit_lang") as Language | null;
    return saved && ["en", "hi", "te"].includes(saved) ? saved : "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("resolvit_lang", lang);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      let text = translations[language]?.[key] || translations.en[key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, v);
        }
      }
      return text;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
