# Project Report: ShopManager AI - Predictive Stock Management

## 1. Project Overview
**ShopManager AI** is a modern, web-based inventory and sales management system designed for small businesses (Grocery stores, Medical shops, Retailers). It leverages Artificial Intelligence to predict future stock requirements based on historical sales data.

## 2. Existing System (Manual/Traditional)
The traditional way of managing small shops involves manual entry in registers or simple spreadsheets.

### DISADVANTAGES:
- **Manual Errors**: Mistakes in entry can lead to incorrect stock counts.
- **No Prediction**: Business owners only know stock is low when it's almost gone (Stock-out).
- **Time Consuming**: Generating reports manually takes hours.
- **Data Security**: Physical registers can be lost or damaged.
- **Limited Access**: The shop owner must be physically present to check stock levels.

## 3. Proposed System (ShopManager AI)
The proposed system automates the entire process using a Cloud-based architecture and AI integration.

### ADVANTAGES:
- **Real-time Tracking**: Instant updates to stock levels after every sale.
- **AI Forecasting**: Uses OpenRouter AI to analyze sales trends and predict what to buy for the next 7 days.
- **Order Moderation**: A structured flow where users request products and Admin approves them.
- **High Security**: Role-based access (Admin/Staff) and encrypted passwords.
- **Anywhere Access**: Hosted on Render with MongoDB Atlas, allowing access from any device.

## 4. System Architecture
- **Frontend**: HTML5, Vanilla CSS, JavaScript (Custom Modern UI).
- **Backend**: FastAPI (Python) - High performance asynchronous server.
- **Database**: MongoDB Atlas (NoSQL) - Scalable cloud database.
- **AI Model**: OpenRouter API for intelligent stock forecasting.

## 5. Key Modules
- **Authentication**: Secure Login/Register with JWT tokens.
- **Inventory Management**: Add, Edit, Delete, and track low-stock items.
- **Sales Tracking**: Record transactions and monitor revenue.
- **Order Moderation**: Admin panel to approve or cancel purchase requests.
- **AI Analytics**: Visual dashboard with graphs showing current stock vs. AI predictions.

---

# திட்ட அறிக்கை (Project Report in Tamil)

## 1. திட்டத்தின் நோக்கம்
**ShopManager AI** என்பது சிறு வணிகர்களுக்காக (மளிகைக் கடை, மருந்தகம்) உருவாக்கப்பட்ட ஒரு நவீன மேலாண்மை மென்பொருள். இது வியாபாரத்தை எளிதாக்கவும், எதிர்கால சரக்கு தேவையை கணிக்கவும் உதவுகிறது.

## 2. தற்போதைய முறை (Existing System)
தற்போது பெரும்பாலான சிறு கடைகளில் நோட்டுப் புத்தகங்களில் (Manual Registers) வரவு செலவு கணக்குகள் எழுதப்படுகின்றன.

### இதில் உள்ள குறைகள்:
- **தவறான கணக்கீடு**: மனித தவறுகளால் ஸ்டாக் கணக்கு மாற வாய்ப்புள்ளது.
- **முன்கூட்டியே தெரியாது**: சரக்கு காலியான பிறகே புதிய சரக்கு வாங்க வேண்டிய நிலை ஏற்படும்.
- **பாதுகாப்பு குறைவு**: நோட்டுகள் தொலைந்து போகவோ அல்லது சேதமடையவோ வாய்ப்புள்ளது.

## 3. புதிய முறை (Proposed System)
நாங்கள் உருவாக்கியுள்ள இந்த AI முறை அனைத்தையும் தானியங்குபடுத்துகிறது.

### சிறப்பம்சங்கள்:
- **AI கணிப்பு**: அடுத்த 7 நாட்களில் எந்தச் சரக்கு எவ்வளவு தேவைப்படும் என்பதை AI மூலம் முன்கூட்டியே அறியலாம்.
- **உடனடி அப்டேட்**: ஒரு பொருள் விற்பனையானதும் தானாகவே ஸ்டாக் குறைந்துவிடும்.
- **அட்மின் கட்டுப்பாடு**: வாடிக்கையாளர் ஆர்டர் செய்தால், அட்மின் அதைச் சரிபார்த்து உறுதி (Approve) செய்யலாம்.
- **எங்கிருந்தும் பார்க்கலாம்**: ஆன்லைனில் இருப்பதால் நீங்கள் கடையிலேயே இருக்கத் தேவையில்லை.

## 4. தொழில்நுட்பம் (Tech Stack)
- **FastAPI**: அதிவேகமான பேக்கெண்ட் சர்வர்.
- **MongoDB Atlas**: பாதுகாப்பான ஆன்லைன் டேட்டாபேஸ்.
- **OpenRouter AI**: அறிவார்ந்த கணிப்புகளைச் செய்ய உதவும் AI.
