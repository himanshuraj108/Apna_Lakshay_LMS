import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Header/General
    "Apna Lakshay": "Apna Lakshay",
    "Language": "Language",
    "English": "English",
    "Hindi": "Hindi",
    "Select Language": "Select Language",
    "Back": "Back",
    "Back to Dashboard": "Back to Dashboard",
    "Dashboard": "Dashboard",
    "Cancel": "Cancel",
    "Save": "Save",
    "Close": "Close",
    "Later": "Later",
    "Pay": "Pay",
    "Confirm": "Confirm",
    "Active": "Active",
    "Inactive": "Inactive",
    "Status": "Status",
    "Notifications": "Notifications",
    "Profile": "Profile",
    "Logout": "Log Out",
    "Yes": "Yes",
    "No": "No",
    "Welcome In": "Welcome In",
    "Attendance Complete": "Attendance Complete",
    "See You Next Time": "See You Next Time",

    // Dashboard Cards
    "My Seat": "My Seat",
    "Not Assigned": "Not Assigned",
    "Confirmed": "Confirmed",
    "Temporary": "Temporary",
    "Attendance": "Attendance",
    "Fee Status": "Fee Status",
    "Fee Reminder": "Fee Reminder",
    "Outstanding": "Outstanding",
    "Amount Due": "Amount Due",
    "I Understand": "I Understand",
    "Paid": "Paid",
    "Overdue": "Overdue",
    "Partial": "Partial",
    "Days": "Days",
    "Rank": "Rank",

    // Daily Challenge
    "Today's Task": "Today's Task",
    "Complete before midnight": "Complete before midnight to keep your streak!",
    "Daily Challenge": "Daily Challenge",
    "questions": "5 target-focused questions",
    "XP": "XP",
    "base reward": "base reward",
    "if 5/5": "if 5/5",
    "kept alive": "kept alive",
    "Select Target": "Select Target",
    "Start Challenge": "Start Challenge",
    "Streak": "Streak",
    "Bonus": "Bonus",

    // Quick Links
    "Mock Tests": "Mock Tests",
    "Books": "Books",
    "Notes": "Notes",
    "Seat Layout": "Seat Layout",
    "Doubt Board": "Doubt Board",
    "Current Affairs": "Current Affairs",
    "Exam Alerts": "Exam Alerts",
    "Monthly Report": "Monthly Report",
    "Study Planner": "Study Planner",
    "Group Discussion": "Group Discussion",
    "Discussion Room": "Discussion Room",

    // Attendance scanner
    "Manual Attendance": "Manual Attendance",
    "Enter PIN": "Enter PIN",
    "Mark Attendance": "Mark Attendance",
    "Scan QR": "Scan QR",
    "Click below to mark": "Click below to mark your attendance",

    // Mock Test Page
    "Practice & Mock Tests": "Practice & Mock Tests",
    "Subject Tests": "Subject Tests",
    "Full Length Tests": "Full Length Tests",
    "High Score": "High Score",
    "Duration": "Duration",
    "Questions": "Questions",
    "Start Test": "Start Test",
    "Submit Test": "Submit Test",
    "End Test": "End Test",
    "Result": "Result",
    "Score": "Score",
    "Correct": "Correct",
    "Incorrect": "Incorrect",
    "Unattempted": "Unattempted",
    "Solutions": "Solutions",
    "View Solutions": "View Solutions",
    "Retake": "Retake Test",
    "Next": "Next",
    "Previous": "Previous",
    "Exams": "Exams",
    "Mins": "Mins",
    "Marks": "Marks",

    // Profile Page
    "Profile Cover": "Profile Cover",
    "Edit Profile": "Edit Profile",
    "Personal Details": "Personal Details",
    "Target Exam": "Target Exam",
    "Study Shift": "Study Shift",
    "Save Changes": "Save Changes",
    "Gender": "Gender",
    "Address": "Address",
    "Email": "Email",
    "Phone": "Phone",
    "Male": "Male",
    "Female": "Female",
    "Other": "Other",

    // Doubt Board
    "Ask a Doubt": "Ask a Doubt",
    "Type your doubt": "Type your doubt here...",
    "Select Subject": "Select Subject",
    "Submit Doubt": "Submit Doubt",
    "Resolved": "Resolved",
    "Pending": "Pending",
    "Ask AI": "Ask AI",
    "Responses": "Responses",

    // Books & Notes
    "Search books": "Search books by title, author...",
    "Search notes": "Search notes by title, topic...",
    "All Books": "All Books",
    "All Notes": "All Notes",
    "View PDF": "View PDF",
    "Download": "Download",
    "Author": "Author",
    "Category": "Category",
    "Learning": "Learning",
    "Curated study books": "Curated study books",
    "Browse & download": "Browse & download",
    "AI Mock Test": "AI Mock Test",
    "Practice tests": "Practice tests",
    "Learn & Grow": "Learn & Grow",
    "Subject Wise Learning": "Subject Wise Learning",
    "Choose a subject to explore curated topics, tutorials, and master quizzes": "Choose a subject to explore curated topics, tutorials, and master quizzes",

    // Study Planner
    "Daily Study Planner": "Daily Study Planner",
    "Add Task": "Add Task",
    "Task title": "What are you studying today?",
    "Add": "Add",
    "Completed": "Completed",

    // Exam Alerts
    "Latest Exam Alerts": "Latest Exam Alerts",
    "Apply Link": "Apply Now",
    "Last Date": "Last Date",

    // Current Affairs
    "Daily Current Affairs": "Daily Current Affairs",
    "Read More": "Read More",
    "Published": "Published",

    // Dashboard additional
    "Quick Actions": "Quick Actions",
    "Leaderboard": "Leaderboard",
    "Sort by XP": "Sort by XP",
    "Sort by Streak": "Sort by Streak",
    "Sort by Focus Hours": "Sort by Focus Hours",
    "ID Card": "ID Card",
    "Planner": "Planner",
    "Discussion": "Discussion",
    "Newspaper": "Newspaper",
    "My Report": "My Report",
    "Support": "Support",
    "AI powered": "AI powered",
    "credits left": "credits left",
    "View Status": "View Status",
    "No active students on the leaderboard yet.": "No active students on the leaderboard yet.",
    "Loading leaderboard...": "Loading leaderboard...",
    "Review Mode": "Review Mode",
    "Live Challenge": "Live Challenge",
    "Question": "Question",
    "of": "of",
    "Explanation": "Explanation",
    "No explanation available.": "No explanation available.",
    "Submitting...": "Submitting...",
    "Submit Challenge": "Submit Challenge",
    "Close Review": "Close Review",
    "Please answer all 5 questions.": "Please answer all 5 questions.",
    "No record": "No record",
    "Pay Online": "Pay Online",
    "YOU": "YOU",
    "Level": "Level",
    "Excellent Work!": "Excellent Work!",
    "Completed for today! Keep it up!": "Completed for today! Keep it up!",
    "Streak maintained successfully": "Streak maintained successfully",
    "Review Solutions": "Review Solutions",
    "XP Earned": "XP Earned",
    "Alerts": "Alerts",
    "Unread notifications": "Unread notifications"
  },
  hi: {
    // Header/General
    "Apna Lakshay": "अपना लक्ष्य",
    "Language": "भाषा",
    "English": "अंग्रेजी",
    "Hindi": "हिंदी",
    "Select Language": "भाषा चुनें",
    "Back": "पीछे",
    "Back to Dashboard": "डैशबोर्ड पर वापस जाएं",
    "Dashboard": "डैशबोर्ड",
    "Cancel": "रद्द करें",
    "Save": "सहेजें",
    "Close": "बंद करें",
    "Later": "बाद में",
    "Pay": "भुगतान करें",
    "Confirm": "पुष्टि करें",
    "Active": "सक्रिय",
    "Inactive": "निष्क्रिय",
    "Status": "स्थिति",
    "Notifications": "सूचनाएं",
    "Profile": "प्रोफ़ाइल",
    "Logout": "लॉग आउट",
    "Yes": "हाँ",
    "No": "नहीं",
    "Welcome In": "स्वागत है",
    "Attendance Complete": "उपस्थिति पूर्ण",
    "See You Next Time": "फिर मिलते हैं",

    // Dashboard Cards
    "My Seat": "मेरी सीट",
    "Not Assigned": "आवंटित नहीं",
    "Confirmed": "पुष्टि की गई",
    "Temporary": "अस्थायी",
    "Attendance": "उपस्थिति",
    "Fee Status": "फीस की स्थिति",
    "Fee Reminder": "फीस अनुस्मारक",
    "Outstanding": "बकाया",
    "Amount Due": "देय राशि",
    "I Understand": "मैं समझ गया",
    "Paid": "भुगतान किया गया",
    "Overdue": "विलंबित",
    "Partial": "आंशिक",
    "Days": "दिन",
    "Rank": "रैंक",

    // Daily Challenge
    "Today's Task": "आज का कार्य",
    "Complete before midnight": "अपनी लकीर (streak) बनाए रखने के लिए आधी रात से पहले पूरा करें!",
    "Daily Challenge": "दैनिक चुनौती",
    "questions": "5 लक्ष्य-केंद्रित प्रश्न",
    "XP": "XP",
    "base reward": "आधार पुरस्कार",
    "if 5/5": "यदि 5/5",
    "kept alive": "जीवित रखा",
    "Select Target": "लक्ष्य चुनें",
    "Start Challenge": "चुनौती शुरू करें",
    "Streak": "लगातार दिन",
    "Bonus": "बोनस",

    // Quick Links
    "Mock Tests": "मॉक टेस्ट",
    "Books": "किताबें",
    "Notes": "नोट्स",
    "Seat Layout": "सीट लेआउट",
    "Doubt Board": "संदेह बोर्ड",
    "Current Affairs": "सामयिकी (करंट अफेयर्स)",
    "Exam Alerts": "परीक्षा अलर्ट",
    "Monthly Report": "मासिक रिपोर्ट",
    "Study Planner": "अध्ययन योजनाकार",
    "Group Discussion": "समूह चर्चा",
    "Discussion Room": "चर्चा कक्ष",

    // Attendance scanner
    "Manual Attendance": "मैनुअल उपस्थिति",
    "Enter PIN": "पिन दर्ज करें",
    "Mark Attendance": "उपस्थिति दर्ज करें",
    "Scan QR": "क्यूआर स्कैन करें",
    "Click below to mark": "अपनी उपस्थिति दर्ज करने के लिए नीचे क्लिक करें",

    // Mock Test Page
    "Practice & Mock Tests": "अभ्यास और मॉक टेस्ट",
    "Subject Tests": "विषय परीक्षण",
    "Full Length Tests": "पूर्ण लंबाई परीक्षण",
    "High Score": "उच्चतम स्कोर",
    "Duration": "अवधि",
    "Questions": "प्रश्न",
    "Start Test": "टेस्ट शुरू करें",
    "Submit Test": "टेस्ट सबमिट करें",
    "End Test": "टेस्ट समाप्त करें",
    "Result": "परिणाम",
    "Score": "स्कोर",
    "Correct": "सही",
    "Incorrect": "गलत",
    "Unattempted": "बिना प्रयास किए",
    "Solutions": "समाधान",
    "View Solutions": "समाधान देखें",
    "Retake": "पुनः प्रयास करें",
    "Next": "अगला",
    "Previous": "पिछला",
    "Exams": "परीक्षाएं",
    "Mins": "मिनट",
    "Marks": "अंक",

    // Profile Page
    "Profile Cover": "प्रोफ़ाइल कवर",
    "Edit Profile": "प्रोफ़ाइल संपादित करें",
    "Personal Details": "व्यक्तिगत विवरण",
    "Target Exam": "लक्ष्य परीक्षा",
    "Study Shift": "अध्ययन पाली",
    "Save Changes": "बदलाव सहेजें",
    "Gender": "लिंग",
    "Address": "पता",
    "Email": "ईमेल",
    "Phone": "फ़ोन",
    "Male": "पुरुष",
    "Female": "महिला",
    "Other": "अन्य",

    // Doubt Board
    "Ask a Doubt": "संदेह पूछें",
    "Type your doubt": "अपना संदेह यहाँ लिखें...",
    "Select Subject": "विषय चुनें",
    "Submit Doubt": "संदेह सबमिट करें",
    "Resolved": "हल किया गया",
    "Pending": "लंबित",
    "Ask AI": "AI से पूछें",
    "Responses": "प्रतिक्रियाएं",

    // Books & Notes
    "Search books": "शीर्षक, लेखक द्वारा पुस्तकें खोजें...",
    "Search notes": "शीर्षक, विषय द्वारा नोट्स खोजें...",
    "All Books": "सभी पुस्तकें",
    "All Notes": "सभी नोट्स",
    "View PDF": "PDF देखें",
    "Download": "डाउनलोड करें",
    "Author": "लेखक",
    "Category": "श्रेणी",
    "Learning": "सीखना",
    "Curated study books": "चयनित अध्ययन पुस्तकें",
    "Browse & download": "खोजें और डाउनलोड करें",
    "AI Mock Test": "AI मॉक टेस्ट",
    "Practice tests": "अभ्यास परीक्षा",
    "Learn & Grow": "सीखें और बढ़ें",
    "Subject Wise Learning": "विषयवार अध्ययन",
    "Choose a subject to explore curated topics, tutorials, and master quizzes": "क्यूरेटेड विषयों, ट्यूटोरियल और मास्टर क्विज़ का पता लगाने के लिए एक विषय चुनें",

    // Study Planner
    "Daily Study Planner": "दैनिक अध्ययन योजना",
    "Add Task": "कार्य जोड़ें",
    "Task title": "आज आप क्या पढ़ रहे हैं?",
    "Add": "जोड़ें",
    "Completed": "पूरा किया",

    // Exam Alerts
    "Latest Exam Alerts": "नवीनतम परीक्षा अलर्ट",
    "Apply Link": "अभी आवेदन करें",
    "Last Date": "अंतिम तिथि",

    // Current Affairs
    "Daily Current Affairs": "दैनिक सामयिकी",
    "Read More": "और पढ़ें",
    "Published": "प्रकाशित",

    // Dashboard additional in Hindi
    "Quick Actions": "त्वरित कार्रवाई",
    "Leaderboard": "लीडरबोर्ड",
    "Sort by XP": "XP द्वारा क्रमबद्ध करें",
    "Sort by Streak": "लगातार दिनों द्वारा क्रमबद्ध करें",
    "Sort by Focus Hours": "फोकस घंटों द्वारा क्रमबद्ध करें",
    "ID Card": "पहचान पत्र",
    "Planner": "योजनाकार",
    "Discussion": "चर्चा कक्ष",
    "Newspaper": "अखबार (न्यूज़पेपर)",
    "My Report": "मेरी रिपोर्ट",
    "Support": "सहायता",
    "AI powered": "एआई संचालित",
    "credits left": "क्रेडिट बचे हैं",
    "View Status": "स्थिति देखें",
    "No active students on the leaderboard yet.": "लीडरबोर्ड पर अभी तक कोई सक्रिय छात्र नहीं है।",
    "Loading leaderboard...": "लीडरबोर्ड लोड हो रहा है...",
    "Review Mode": "समीक्षा मोड",
    "Live Challenge": "लाइव चुनौती",
    "Question": "प्रश्न",
    "of": "में से",
    "Explanation": "स्पष्टीकरण",
    "No explanation available.": "कोई स्पष्टीकरण उपलब्ध नहीं है।",
    "Submitting...": "सबमिट किया जा रहा है...",
    "Submit Challenge": "चुनौती सबमिट करें",
    "Close Review": "समीक्षा बंद करें",
    "Please answer all 5 questions.": "कृपया सभी 5 प्रश्नों के उत्तर दें।",
    "No record": "कोई रिकॉर्ड नहीं",
    "Pay Online": "ऑनलाइन भुगतान करें",
    "YOU": "आप",
    "Level": "स्तर",
    "Excellent Work!": "उत्कृष्ट कार्य!",
    "Completed for today! Keep it up!": "आज के लिए पूरा हो गया! इसे जारी रखें!",
    "Streak maintained successfully": "Streak सफलतापूर्वक बनी रही",
    "Review Solutions": "समाधानों की समीक्षा करें",
    "XP Earned": "अर्जित XP",
    "Alerts": "अलर्ट",
    "Unread notifications": "अपठित सूचनाएं"
  }
};

// Common terms translations used dynamically (e.g. subjects, exams, etc.)
export const dynamicTranslations = {
  hi: {
    // Exam Targets
    "uppsc": "यूपीपीएससी",
    "upsc": "यूपीएससी",
    "ssc": "एसएससी",
    "ssc_cgl": "एसएससी सीजीएल",
    "railway": "रेलवे",
    "banking": "बैंकिंग",
    "neet": "नीट",
    "jee": "जीईई",
    "generic": "सामान्य योग्यता",
    "Select Target": "लक्ष्य चुनें",

    // Subjects
    "Mathematics": "गणित",
    "Maths": "गणित",
    "Physics": "भौतिक विज्ञान",
    "Chemistry": "रसायन विज्ञान",
    "Biology": "जीव विज्ञान",
    "History": "इतिहास",
    "Geography": "भूगोल",
    "Polity": "राजव्यवस्था",
    "Economy": "अर्थव्यवस्था",
    "General Knowledge": "सामान्य ज्ञान",
    "GK": "सामान्य ज्ञान",
    "Current Affairs": "सामयिकी",
    "English": "अंग्रेजी",
    "Reasoning": "तर्कशक्ति",
    "Aptitude": "योग्यता",
    "General Aptitude": "सामान्य योग्यता",
    "General Studies": "सामान्य अध्ययन",
    
    // Shifts
    "Morning": "सुबह की पाली",
    "Evening": "शाम की पाली",
    "Night": "रात की पाली",
    "Full Day": "पूरा दिन",
    
    // Seat details
    "Library Room": "लाइब्रेरी कमरा"
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('app_language');
    if (saved) return saved;

    // Auto-detect from browser's language preference
    const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    const defaultLang = browserLang.startsWith('hi') ? 'hi' : 'en';

    // Save to localStorage so it is set until changed
    localStorage.setItem('app_language', defaultLang);
    return defaultLang;
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    // Dispatch a storage event to keep other tabs/contexts updated instantly
    window.dispatchEvent(new Event('languageChange'));
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handleLangChange = () => {
      const saved = localStorage.getItem('app_language');
      if (saved) {
        setLanguageState(saved);
        document.documentElement.lang = saved;
      }
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = (key) => {
    if (!key) return '';
    
    // 1. Direct dictionary lookup
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    
    // 2. Dynamic dictionary lookup for database values
    if (language === 'hi') {
      const dynamicDict = dynamicTranslations['hi'];
      // Try exact string
      if (dynamicDict[key]) return dynamicDict[key];
      // Try lowercase
      const lowerKey = key.toString().toLowerCase().trim();
      if (dynamicDict[lowerKey]) return dynamicDict[lowerKey];
    }

    // 3. Fallback to original key
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
