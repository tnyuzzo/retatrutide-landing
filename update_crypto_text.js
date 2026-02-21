const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, 'messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(messagesDir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const isIt = file === 'it.json';

  // 1. Remove references to (Crypto) in NavBar
  content.Index.nav_order = isIt ? "Ordina Ora" : "Order Now";

  // 2. Remove references to "Crypto" and "Secure Crypto Checkout"
  content.Index.footer_secure = isIt ? "Checkout Sicuro a 256-bit" : "Secure 256-bit Checkout";
  
  // 3. Card 2 - Change from "Crypto Native Checkout" to simple "Secure Checkout"
  content.Index.card2_title = isIt ? "Checkout Sicuro e Privato" : "Secure & Private Checkout";
  content.Index.card2_desc = isIt 
    ? "La tua privacy è la nostra priorità. Offriamo un processo di evasione ordini 100% discreto, sicuro e senza tracciamento, dalla conferma alla consegna diretta." 
    : "Your privacy is our priority. We offer a 100% discreet, secure, and untracked fulfillment process, from confirmation to direct delivery.";
  
  // 4. Feature Highlights (Header Banner) - Replace "No Fiat" with "Privacy"
  content.Index.feature_crypto = isIt ? "Privacy Totale" : "Complete Privacy";
  content.Index.feature_crypto_sub = isIt ? "Dati Protetti al 100%" : "100% Data Protection";

  // 5. Hero CTA Text - remove "Credit Card & Crypto accepted"
  content.Index.hero_cta_per_vial = isIt ? "a flacone. Checkout multi-offerta." : "per vial. Flexible purchasing options.";

  // 6. FAQ adjustments - Remove Q3 and Q4 about crypto. Replace with generic shipping/payment safety FAQs
  content.Index.faq_q3 = isIt ? "Come garantite la mia privacy?" : "How do you guarantee my privacy?";
  content.Index.faq_a3 = isIt 
    ? "La tua sicurezza è fondamentale. Tutti gli ordini passano attraverso gateway crittografati offline. Utilizziamo imballaggi stealth senza riferimenti esterni al contenuto."
    : "Your security is paramount. All orders pass through offline encrypted gateways. We utilize stealth packaging with no external references to the contents.";
    
  content.Index.faq_q4 = isIt ? "Quali sono i tempi di elaborazione?" : "What are the processing times?";
  content.Index.faq_a4 = isIt 
    ? "Gli ordini confermati entro le 12:00 (CET) vengono elaborati e spediti lo stesso giorno lavorativo. Riceverai un'email con il tracciamento sicuro non appena il pacco lascerà la logistica."
    : "Orders confirmed before 12:00 PM (CET) are processed and shipped the same business day. You will receive a secure tracking email as soon as the package leaves logistics.";

  // Fix typo in italian pricing (previously stated 97€ as bulk, ensure it's fluid)
  content.Index.review_3_desc = isIt 
    ? "\"Il supporto clienti è davvero 24/7. Ho avuto un problema con il checkout, li ho contattati via email e hanno risolto manualmente in 10 minuti.\""
    : "\"Customer support is actually 24/7. Had an issue checking out, emailed them and got it sorted manually in 10 minutes. Top tier service.\"";

  fs.writeFileSync(filePath, JSON.stringify(content, null, 4));
  console.log(`Updated Crypto References in ${file}`);
}
