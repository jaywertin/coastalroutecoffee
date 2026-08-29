import type { Metadata } from "next";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy | Coastal Route Coffee",
  description: "How Coastal Route Coffee collects, uses, and protects personal information.",
};

const sectionClass = "scroll-mt-8";
const headingClass = "font-display text-3xl text-[#102638]";
const subheadingClass = "mt-6 text-lg font-bold text-[#102638]";
const linkClass = "font-semibold text-[#9b6a2d] underline underline-offset-4";
const listClass = "mt-4 list-disc space-y-2 pl-6";

const contents = [
  "What information do we collect?",
  "How do we use your information?",
  "Will your information be shared with anyone?",
  "Do we use cookies and other tracking technologies?",
  "Do we use Google Maps Platform APIs?",
  "How do we handle your social logins?",
  "How long do we keep your information?",
  "How do we keep your information safe?",
  "Do we collect information from minors?",
  "What are your privacy rights?",
  "Controls for Do-Not-Track features",
  "Do California residents have specific privacy rights?",
  "Do we make updates to this notice?",
  "How can you contact us about this notice?",
  "How can you review, update, or delete the data we collect from you?",
];

const californiaCategories = [
  ["A. Identifiers", "Real name, alias, postal address, telephone or mobile number, unique personal identifier, online identifier, IP address, email address and account name", "Yes"],
  ["B. California Customer Records information", "Name, contact information, education, employment, employment history and financial information", "Yes"],
  ["C. Protected classifications", "Gender and date of birth", "No"],
  ["D. Commercial information", "Transaction information, purchase history, financial details and payment information", "Yes"],
  ["E. Biometric information", "Fingerprints and voiceprints", "No"],
  ["F. Internet or network activity", "Browsing history, search history, online behavior, interest data, and interactions with websites, applications, systems and advertisements", "No"],
  ["G. Geolocation data", "Device location", "No"],
  ["H. Sensory information", "Images and audio, video or call recordings created in connection with our business activities", "No"],
  ["I. Professional information", "Business contact details, job title, work history and professional qualifications", "No"],
  ["J. Education information", "Student records and directory information", "No"],
  ["K. Inferences", "Inferences drawn from personal information to create a profile or summary of preferences and characteristics", "No"],
] as const;

export default function PrivacyPolicyPage() {
  return (
    <main>
      <SiteHeader />
      <section className="bg-[#f6f0e5] px-6 py-16 sm:py-24 lg:px-10">
        <article className="mx-auto max-w-4xl">
          <p className="eyebrow text-[#9b6a2d]">Your information</p>
          <h1 className="font-display mt-5 text-6xl leading-[0.92] tracking-[-0.045em] sm:text-7xl">Privacy Policy</h1>
          <p className="mt-5 text-sm text-[#102638]/55">Last updated August 29, 2026</p>

          <div className="mt-10 space-y-5 text-base leading-7 text-[#102638]/70">
            <p>Thank you for choosing to be part of our community at Coastal Route Coffee (“Company,” “we,” “us,” or “our”). We are committed to protecting your personal information and your right to privacy. If you have questions or concerns about this privacy notice or our practices regarding your personal information, contact us at <a className={linkClass} href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a>.</p>
            <p>When you visit <a className={linkClass} href="https://coastalroutecoffee.com">coastalroutecoffee.com</a> (the “Website”) or use any of our services (the “Services”), you trust us with your personal information. This notice explains what information we collect, how we use it, and what rights you have. If you do not agree with any terms in this notice, please discontinue use of our Services.</p>
            <p>This notice applies to information collected through our Services, including the Website, and any related services, sales, marketing, or events.</p>

            <nav aria-label="Privacy policy contents" className="rounded-[1.5rem] bg-[#fffdf8] p-6 shadow-[0_18px_50px_rgba(15,31,46,0.06)] sm:p-8">
              <h2 className="font-display text-3xl text-[#102638]">Contents</h2>
              <ol className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                {contents.map((item, index) => <li key={item}><a className="hover:text-[#9b6a2d]" href={`#section-${index + 1}`}>{index + 1}. {item}</a></li>)}
              </ol>
            </nav>

            <section id="section-1" className={sectionClass}>
              <h2 className={headingClass}>1. What information do we collect?</h2>
              <h3 className={subheadingClass}>Personal information you disclose to us</h3>
              <p className="mt-3"><strong>In short:</strong> We collect personal information that you provide to us.</p>
              <p className="mt-3">We collect personal information that you voluntarily provide when you register on the Website, express an interest in our products and Services, participate in activities on the Website, make a purchase, or contact us. This may include names, phone numbers, email addresses, mailing addresses, usernames, billing addresses, and similar information.</p>
              <p className="mt-3"><strong>Payment data.</strong> We may collect data needed to process a payment, such as a payment instrument number and associated security code. Payment data is processed and stored by Stripe. You can review <a className={linkClass} href="https://stripe.com/privacy" target="_blank" rel="noreferrer">Stripe&apos;s Privacy Policy</a>.</p>
              <p className="mt-3"><strong>Social media login data.</strong> We may offer the option to register using existing social media account details. If you choose this option, we collect the information described in section 6 below.</p>
              <p className="mt-3">All personal information you provide must be true, complete, and accurate, and you must notify us of changes.</p>
              <h3 className={subheadingClass}>Information automatically collected</h3>
              <p className="mt-3"><strong>In short:</strong> Some information, such as your IP address and browser or device characteristics, is collected automatically when you visit the Website.</p>
              <p className="mt-3">This information may include device and usage information, operating system, language preferences, referring URLs, device name, country, general location, how and when you use the Website, and other technical information. It is primarily used for security, operation, analytics, and reporting.</p>
              <ul className={listClass}>
                <li><strong>Log and usage data:</strong> diagnostic, usage, performance, activity, device-event, and error information recorded when you use the Website.</li>
                <li><strong>Device data:</strong> information about the computer, phone, tablet, browser, hardware, operating system, internet provider, or mobile carrier used to access the Website.</li>
                <li><strong>Location data:</strong> precise or imprecise location information depending on your device and settings. You may disable location access, although doing so may affect certain Services.</li>
              </ul>
            </section>

            <section id="section-2" className={sectionClass}>
              <h2 className={headingClass}>2. How do we use your information?</h2>
              <p className="mt-3"><strong>In short:</strong> We process information based on legitimate business interests, fulfillment of our contract with you, legal obligations, and/or your consent.</p>
              <p className="mt-3">We may use information to:</p>
              <ul className={listClass}>
                <li>Facilitate account creation and login, including third-party account connections you authorize.</li>
                <li>Post testimonials with consent and respond to requests to update or remove them.</li>
                <li>Request feedback and communicate about your use of the Website.</li>
                <li>Enable communications and manage user accounts.</li>
                <li>Send administrative, product, service, policy, and feature information.</li>
                <li>Protect our Services, monitor fraud, and enforce terms and policies.</li>
                <li>Comply with legal and regulatory requirements and respond to lawful requests.</li>
                <li>Fulfill and manage orders, payments, returns, exchanges, and delivery.</li>
                <li>Administer promotions or competitions you choose to enter.</li>
                <li>Provide customer service and respond to inquiries.</li>
                <li>Send marketing communications consistent with your preferences. You may opt out at any time.</li>
                <li>Develop and display personalized content or advertising and measure its effectiveness.</li>
              </ul>
            </section>

            <section id="section-3" className={sectionClass}>
              <h2 className={headingClass}>3. Will your information be shared with anyone?</h2>
              <p className="mt-3"><strong>In short:</strong> We share information only with consent, to comply with laws, provide Services, protect rights, or fulfill business obligations.</p>
              <p className="mt-3">We may process or share data based on consent, legitimate interests, performance of a contract, legal obligations, or vital interests such as preventing fraud, addressing safety threats, investigating unlawful activity, or supporting litigation. We may also share or transfer information during negotiations for a merger, financing, acquisition, sale of assets, or similar business transfer.</p>
            </section>

            <section id="section-4" className={sectionClass}>
              <h2 className={headingClass}>4. Do we use cookies and other tracking technologies?</h2>
              <p className="mt-3"><strong>In short:</strong> We may use cookies and similar technologies to collect and store information.</p>
              <p className="mt-3">We may use cookies, web beacons, pixels, and similar technologies to access or store information. You can control cookies through your browser settings, although disabling them may affect some Website features.</p>
            </section>

            <section id="section-5" className={sectionClass}>
              <h2 className={headingClass}>5. Do we use Google Maps Platform APIs?</h2>
              <p className="mt-3"><strong>In short:</strong> We may use Google Maps Platform APIs to provide better service.</p>
              <p className="mt-3">Google Maps Platform APIs are subject to <a className={linkClass} href="https://developers.google.com/maps/terms" target="_blank" rel="noreferrer">Google&apos;s terms</a> and <a className={linkClass} href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">privacy policy</a>.</p>
            </section>

            <section id="section-6" className={sectionClass}>
              <h2 className={headingClass}>6. How do we handle your social logins?</h2>
              <p className="mt-3"><strong>In short:</strong> If you register or log in using a social media account, we may access certain profile information.</p>
              <p className="mt-3">Information received depends on the provider and may include your name, email address, friends list, profile image, and information you make public. We use it only as described in this notice or as otherwise explained on the Website. We do not control how social media providers use your information, so we recommend reviewing their privacy notices and settings.</p>
            </section>

            <section id="section-7" className={sectionClass}>
              <h2 className={headingClass}>7. How long do we keep your information?</h2>
              <p className="mt-3"><strong>In short:</strong> We keep information as long as necessary for the purposes in this notice unless law requires otherwise.</p>
              <p className="mt-3">When we no longer have an ongoing legitimate business need, we delete or anonymize information. If immediate deletion is not possible, such as information in backup archives, we securely store and isolate it until deletion is possible.</p>
            </section>

            <section id="section-8" className={sectionClass}>
              <h2 className={headingClass}>8. How do we keep your information safe?</h2>
              <p className="mt-3"><strong>In short:</strong> We use organizational and technical measures designed to protect personal information.</p>
              <p className="mt-3">No electronic transmission or storage technology can be guaranteed to be completely secure. Although we work to protect your information, transmission to and from the Website is at your own risk, and you should access the Website only in a secure environment.</p>
            </section>

            <section id="section-9" className={sectionClass}>
              <h2 className={headingClass}>9. Do we collect information from minors?</h2>
              <p className="mt-3"><strong>In short:</strong> We do not knowingly collect data from or market to children under 18.</p>
              <p className="mt-3">If we learn that personal information from a person under 18 has been collected, we will take reasonable measures to delete it. If you become aware of such information, contact <a className={linkClass} href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a>.</p>
            </section>

            <section id="section-10" className={sectionClass}>
              <h2 className={headingClass}>10. What are your privacy rights?</h2>
              <p className="mt-3"><strong>In short:</strong> You may review, change, or terminate your account at any time.</p>
              <p className="mt-3">Depending on where you live, you may have rights to complain to a local data protection authority. To review or change account information or request account termination, contact us. We may retain information needed to prevent fraud, troubleshoot, investigate, enforce our terms, or comply with law.</p>
              <p className="mt-3"><strong>Cookies:</strong> You may configure your browser to remove or reject cookies, but this may affect Website features.</p>
              <p className="mt-3"><strong>Email marketing:</strong> You can unsubscribe using the link in a marketing email or by contacting us. We may still send service-related or non-marketing communications.</p>
            </section>

            <section id="section-11" className={sectionClass}>
              <h2 className={headingClass}>11. Controls for Do-Not-Track features</h2>
              <p className="mt-3">Some browsers and devices include a Do-Not-Track (“DNT”) setting. No uniform standard for recognizing DNT signals has been finalized, so we do not currently respond to them. If a standard we must follow is adopted, we will describe that practice in an updated notice.</p>
            </section>

            <section id="section-12" className={sectionClass}>
              <h2 className={headingClass}>12. Do California residents have specific privacy rights?</h2>
              <p className="mt-3"><strong>In short:</strong> California residents may have specific rights regarding access to personal information.</p>
              <p className="mt-3">California&apos;s “Shine the Light” law permits residents to request, once per year and free of charge, information about categories of personal information disclosed to third parties for direct marketing and the names and addresses of those third parties. Submit requests in writing using the contact information below.</p>
              <h3 className={subheadingClass}>California privacy notice</h3>
              <p className="mt-3">The categories of personal information identified by the existing Coastal Route Coffee privacy notice as collected during the preceding 12 months are:</p>
              <div className="mt-5 overflow-x-auto rounded-2xl border border-[#102638]/10 bg-[#fffdf8]">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="bg-[#102638] text-white"><tr><th className="p-4">Category</th><th className="p-4">Examples</th><th className="p-4">Collected</th></tr></thead>
                  <tbody>{californiaCategories.map(([category, examples, collected]) => <tr key={category} className="border-t border-[#102638]/10"><th scope="row" className="p-4 align-top font-semibold text-[#102638]">{category}</th><td className="p-4 align-top">{examples}</td><td className="p-4 align-top font-semibold uppercase">{collected}</td></tr>)}</tbody>
                </table>
              </div>
              <p className="mt-5">We may also collect information when you seek customer support, participate in surveys or contests, use our Services, or contact us. We use information as described in this notice and may disclose it to contracted service providers that process information on our behalf.</p>
              <p className="mt-3">Coastal Route Coffee has not sold personal information and does not intend to sell personal information belonging to Website visitors, users, or consumers.</p>
              <h3 className={subheadingClass}>Your California privacy rights</h3>
              <ul className={listClass}>
                <li><strong>Request deletion:</strong> You may request deletion, subject to exceptions provided by law.</li>
                <li><strong>Request to know:</strong> You may ask whether we collect and use personal information, which categories we collect, why we use it, and whether it is sold or disclosed.</li>
                <li><strong>Non-discrimination:</strong> We will not discriminate against you for exercising privacy rights.</li>
                <li><strong>Correction and restriction:</strong> You may request correction of inaccurate information, object to processing, or ask us to restrict processing where applicable.</li>
                <li><strong>Authorized agents:</strong> You may designate an authorized agent, subject to proof of authorization.</li>
              </ul>
              <p className="mt-4">We may need to verify your identity using information already provided to us or an established contact method. Additional information provided for verification will be used only for that purpose and deleted when verification is complete.</p>
              <p className="mt-3">To exercise these rights, email <a className={linkClass} href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a>.</p>
            </section>

            <section id="section-13" className={sectionClass}>
              <h2 className={headingClass}>13. Do we make updates to this notice?</h2>
              <p className="mt-3"><strong>In short:</strong> We update this notice as necessary to remain compliant with relevant laws.</p>
              <p className="mt-3">The updated version will show a revised date and will be effective when accessible. For material changes, we may post a prominent notice or send a direct notification. We encourage you to review this notice periodically.</p>
            </section>

            <section id="section-14" className={sectionClass}>
              <h2 className={headingClass}>14. How can you contact us about this notice?</h2>
              <p className="mt-3">Email <a className={linkClass} href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a> or write to:</p>
              <address className="mt-4 border-l-2 border-[#c18d3d] pl-5 not-italic">Coastal Route Coffee<br />P.O. Box 74312<br />San Clemente, CA 92673<br />United States</address>
            </section>

            <section id="section-15" className={sectionClass}>
              <h2 className={headingClass}>15. How can you review, update, or delete the data we collect from you?</h2>
              <p className="mt-3">Depending on applicable law, you may request access to, correction of, or deletion of personal information we collect. Email <a className={linkClass} href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a> to submit a request. We will respond within 30 days.</p>
            </section>
          </div>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
