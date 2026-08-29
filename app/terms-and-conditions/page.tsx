import type { Metadata } from "next";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = {
  title: "Terms & Conditions | Coastal Route Coffee",
  description: "Terms governing use of the Coastal Route Coffee website and storefront.",
};

const headingClass = "font-display text-3xl text-[#102638]";
const subheadingClass = "mt-6 text-lg font-bold text-[#102638]";
const listClass = "mt-4 list-disc space-y-2 pl-6";
const linkClass = "font-semibold text-[#9b6a2d] underline underline-offset-4";

const prohibitedActivities = [
  "Systematically retrieve Site data or content to create a collection, compilation, database, or directory without written permission.",
  "Trick, defraud, or mislead us or other users, including attempts to obtain sensitive account information.",
  "Circumvent or interfere with security features or restrictions on use or copying of Site content.",
  "Disparage, tarnish, harass, abuse, intimidate, threaten, or otherwise harm us, the Site, our personnel, or another person.",
  "Use information obtained from the Site to harass, abuse, or harm another person.",
  "Misuse support services or submit false reports of abuse or misconduct.",
  "Use the Site in violation of law or for an illegal or unauthorized purpose.",
  "Upload or transmit viruses, Trojan horses, spam, or other material that interferes with the Site or another party's use of it.",
  "Use scripts, bots, data-mining tools, scrapers, automated purchasing agents, or other unauthorized automated systems.",
  "Impersonate another user or person, use another user's username, sell or transfer a profile, or create accounts under false pretenses.",
  "Interfere with the Site or connected services, bypass access restrictions, or reverse engineer Site software.",
  "Collect usernames or email addresses for unsolicited communications or use the Site to compete with us or for an unauthorized commercial enterprise.",
];

export default function TermsAndConditionsPage() {
  return (
    <main>
      <SiteHeader />
      <section className="bg-[#f6f0e5] px-6 py-16 sm:py-24 lg:px-10">
        <article className="mx-auto max-w-4xl">
          <p className="eyebrow text-[#9b6a2d]">Using our storefront</p>
          <h1 className="font-display mt-5 text-6xl leading-[0.92] tracking-[-0.045em] sm:text-7xl">Terms &amp; Conditions</h1>
          <p className="mt-5 text-sm text-[#102638]/55">Last updated August 29, 2026</p>

          <div className="mt-10 space-y-10 text-base leading-7 text-[#102638]/70">
            <section>
              <h2 className={headingClass}>Agreement to terms</h2>
              <p className="mt-4">These Terms of Use constitute a legally binding agreement between you, whether personally or on behalf of an entity, and Coastal Route Coffee (“Company,” “we,” “us,” or “our”) concerning your access to and use of coastalroutecoffee.com and related media, mobile websites, or applications (collectively, the “Site”). By accessing the Site, you confirm that you have read, understood, and agreed to these Terms. If you do not agree, you must discontinue use immediately.</p>
              <p className="mt-4">Supplemental terms or documents posted on the Site are incorporated by reference. We may modify these Terms at any time by updating the “Last updated” date. Your continued use after revised Terms are posted constitutes acceptance of those changes.</p>
              <p className="mt-4">People accessing the Site from other locations do so on their own initiative and are responsible for compliance with applicable local laws. The Site is not tailored to industry-specific regulations such as HIPAA, FISMA, or GLBA. The Site is intended for users who are at least 18 years old.</p>
            </section>

            <section>
              <h2 className={headingClass}>Intellectual property rights</h2>
              <p className="mt-4">Unless otherwise indicated, the Site and its source code, databases, functionality, software, design, audio, video, text, photographs, graphics, trademarks, service marks, and logos (collectively, “Content” and “Marks”) are owned or controlled by us or licensed to us and are protected by applicable intellectual-property laws.</p>
              <p className="mt-4">The Content and Marks are provided for personal, non-commercial use. Except as expressly permitted, no part of the Site may be copied, reproduced, republished, displayed, translated, distributed, sold, licensed, or otherwise commercially exploited without our prior written permission. Eligible users receive a limited license to access the Site and print or download portions properly accessed for personal, non-commercial use.</p>
            </section>

            <section>
              <h2 className={headingClass}>User representations and registration</h2>
              <p className="mt-4">By using the Site, you represent that information you submit is accurate and complete; you have legal capacity to accept these Terms; you are not a minor in your jurisdiction; you will not access the Site through unauthorized automated means; and your use will comply with applicable law.</p>
              <p className="mt-4">If registration is available, you are responsible for maintaining the confidentiality of your account and password. We may remove or change an inappropriate username and may suspend or terminate an account containing inaccurate, outdated, or incomplete information.</p>
            </section>

            <section>
              <h2 className={headingClass}>Prohibited activities</h2>
              <p className="mt-4">You may use the Site only for the purposes for which it is made available. You agree not to:</p>
              <ul className={listClass}>{prohibitedActivities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
            </section>

            <section>
              <h2 className={headingClass}>User-generated contributions</h2>
              <p className="mt-4">If the Site permits content such as reviews, comments, photographs, videos, suggestions, or other submissions (“Contributions”), your Contributions may be viewable by others and treated as non-confidential and non-proprietary. You represent that you own or have permission to use your Contributions; they are accurate; they do not violate intellectual-property, privacy, publicity, or other rights; and they do not contain unlawful, abusive, discriminatory, misleading, obscene, exploitative, or unsolicited material.</p>
              <p className="mt-4">Violations may result in suspension or termination of access to the Site.</p>
            </section>

            <section>
              <h2 className={headingClass}>Contribution license</h2>
              <p className="mt-4">By posting Contributions or making them accessible through linked social accounts, you grant us a worldwide, transferable, royalty-free, fully paid, perpetual, irrevocable, non-exclusive license to host, use, reproduce, publish, display, distribute, adapt, translate, and create derivative works from those Contributions in any media. You retain ownership of your Contributions and remain solely responsible for them.</p>
              <p className="mt-4">We may edit, recategorize, restrict, or remove Contributions at any time but have no obligation to monitor them.</p>
            </section>

            <section>
              <h2 className={headingClass}>Guidelines for reviews</h2>
              <p className="mt-4">Reviews should reflect firsthand experience and must not include profanity, abusive or discriminatory language, illegal content, false or misleading statements, or coordinated review campaigns. Reviewers should disclose relevant affiliations. We may accept, reject, or remove reviews at our discretion. Reviews do not necessarily represent our views.</p>
            </section>

            <section>
              <h2 className={headingClass}>Social media and third-party accounts</h2>
              <p className="mt-4">If the Site permits you to link a third-party account, you represent that you are entitled to provide the relevant login information or authorize access. Information made available depends on the provider and your privacy settings. Your relationship with the provider is governed by your agreement with that provider, and we are not responsible for the provider or its content.</p>
              <p className="mt-4">If available, you may disable the connection through account settings or by contacting us. We will attempt to delete information obtained through the linked account, except information needed to maintain your Site account.</p>
            </section>

            <section>
              <h2 className={headingClass}>Submissions</h2>
              <p className="mt-4">Questions, comments, suggestions, ideas, feedback, or other information you provide regarding the Site are non-confidential and may become our property. We may use and distribute them for lawful purposes without acknowledgment or compensation.</p>
            </section>

            <section>
              <h2 className={headingClass}>Third-party websites and content</h2>
              <p className="mt-4">The Site may link to third-party websites or display third-party content. We do not investigate or endorse that content and are not responsible for its accuracy, practices, policies, products, or services. When you leave the Site, these Terms no longer apply. Review the third party&apos;s terms and privacy practices before interacting or purchasing.</p>
            </section>

            <section>
              <h2 className={headingClass}>Advertisers</h2>
              <p className="mt-4">If advertisements are displayed, advertisers are responsible for their advertisements, products, and services and represent that they possess the rights needed to place them. Our provision of advertising space does not create another relationship with the advertiser.</p>
            </section>

            <section>
              <h2 className={headingClass}>Site management</h2>
              <p className="mt-4">We may monitor the Site for violations, take legal action, report users to authorities, restrict access to or remove Contributions, remove burdensome files or content, and otherwise manage the Site to protect our rights and facilitate proper operation.</p>
            </section>

            <section>
              <h2 className={headingClass}>Privacy policy</h2>
              <p className="mt-4">Our <a className={linkClass} href="/privacy-policy">Privacy Policy</a> is incorporated into these Terms. The Site is hosted in the United States. If you access it from another region, you understand that your information may be transferred to and processed in the United States.</p>
            </section>

            <section>
              <h2 className={headingClass}>Copyright infringements</h2>
              <p className="mt-4">We respect intellectual-property rights. If you believe material on the Site infringes a copyright you own or control, notify us using the contact information below. Material misrepresentations in an infringement notice may result in liability, so consider consulting an attorney if you are uncertain.</p>
            </section>

            <section>
              <h2 className={headingClass}>Term and termination</h2>
              <p className="mt-4">These Terms remain effective while you use the Site. To the extent permitted by law, we may deny access, block IP addresses, terminate use or participation, delete accounts, or remove posted content for breach of these Terms, applicable law, or other reasons. We may also pursue available civil, criminal, or injunctive remedies.</p>
            </section>

            <section>
              <h2 className={headingClass}>Modifications and interruptions</h2>
              <p className="mt-4">We may change, remove, suspend, or discontinue Site content or functionality, including prices, without notice. We do not guarantee uninterrupted availability and are not liable for loss, damage, or inconvenience caused by maintenance, downtime, errors, or discontinuance. These Terms do not obligate us to maintain, support, correct, or update the Site.</p>
            </section>

            <section>
              <h2 className={headingClass}>Governing law</h2>
              <p className="mt-4">These Terms and your use of the Site are governed by the laws of the State of California, without regard to conflict-of-law principles.</p>
            </section>

            <section>
              <h2 className={headingClass}>Dispute resolution</h2>
              <h3 className={subheadingClass}>Informal negotiations</h3>
              <p className="mt-3">Before initiating arbitration, each party agrees to attempt to resolve a dispute informally for at least thirty (30) days after written notice.</p>
              <h3 className={subheadingClass}>Binding arbitration</h3>
              <p className="mt-3">Unresolved disputes, except those excluded below, will be resolved by binding arbitration under the Commercial Arbitration Rules and applicable Consumer Rules of the American Arbitration Association (“AAA”). Arbitration may occur in person, by document submission, by phone, or online and will take place in Orange County, California unless applicable rules or law require otherwise.</p>
              <p className="mt-3 font-semibold text-[#102638]">Without this provision, the parties would have the right to sue in court and have a jury trial.</p>
              <p className="mt-3">If a dispute proceeds in court, it must be brought in the state or federal courts located in Orange County, California, and the parties consent to jurisdiction and venue there. A dispute related to the Site must be brought within one (1) year after the cause of action arose, to the extent enforceable.</p>
              <h3 className={subheadingClass}>Restrictions and exceptions</h3>
              <p className="mt-3">Arbitration is limited to the dispute between the parties individually and may not be joined with another proceeding or brought as a class or representative action. Claims concerning intellectual-property rights, theft, piracy, invasion of privacy, unauthorized use, or injunctive relief are excluded from informal-negotiation and arbitration provisions to the extent stated in the existing Terms.</p>
            </section>

            <section>
              <h2 className={headingClass}>Corrections</h2>
              <p className="mt-4">The Site may contain typographical errors, inaccuracies, or omissions regarding descriptions, prices, availability, or other information. We may correct or update that information at any time without prior notice.</p>
            </section>

            <section>
              <h2 className={headingClass}>Disclaimer</h2>
              <p className="mt-4 uppercase">The Site is provided on an “as-is” and “as-available” basis. To the fullest extent permitted by law, we disclaim express and implied warranties, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant the accuracy or completeness of Site content or third-party content and are not responsible for errors, personal injury, property damage, unauthorized access, interruptions, malware, or losses arising from content made available through the Site.</p>
              <p className="mt-4 uppercase">We do not warrant, endorse, guarantee, or assume responsibility for third-party products or services advertised or offered through the Site or linked websites, and we are not responsible for transactions between you and third-party providers.</p>
            </section>

            <section>
              <h2 className={headingClass}>Limitations of liability</h2>
              <p className="mt-4 uppercase">To the fullest extent permitted by law, we and our directors, employees, or agents will not be liable for direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profits, revenue, or data, arising from use of the Site. Our total liability will not exceed the amount you paid us during the six (6) months preceding the cause of action. Some jurisdictions do not allow certain limitations, so some limitations may not apply to you.</p>
            </section>

            <section>
              <h2 className={headingClass}>Indemnification</h2>
              <p className="mt-4">You agree to defend, indemnify, and hold us, our affiliates, officers, agents, partners, and employees harmless from claims, losses, liabilities, damages, and reasonable legal expenses arising from your Contributions, use of the Site, breach of these Terms or your representations, violation of another person&apos;s rights, or harmful acts toward another Site user. We may assume exclusive defense and control of a covered matter, and you agree to cooperate.</p>
            </section>

            <section>
              <h2 className={headingClass}>User data</h2>
              <p className="mt-4">We may maintain data transmitted to the Site and data relating to your use. Although we perform routine backups, you are responsible for data you transmit and activities undertaken through the Site. To the extent permitted by law, we are not liable for loss or corruption of that data.</p>
            </section>

            <section>
              <h2 className={headingClass}>Electronic communications, transactions, and signatures</h2>
              <p className="mt-4">Visiting the Site, sending email, and completing online forms are electronic communications. You consent to electronic communications and agree that electronic agreements, notices, disclosures, and other communications satisfy legal writing requirements. You agree to electronic signatures, contracts, orders, records, and delivery of notices, policies, and transaction records to the extent permitted by law.</p>
            </section>

            <section>
              <h2 className={headingClass}>California users and residents</h2>
              <p className="mt-4">If a complaint is not satisfactorily resolved, you may contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834, or by telephone at <a className={linkClass} href="tel:+18009525210">(800) 952-5210</a> or <a className={linkClass} href="tel:+19164451254">(916) 445-1254</a>.</p>
            </section>

            <section>
              <h2 className={headingClass}>Miscellaneous</h2>
              <p className="mt-4">These Terms and policies posted on the Site constitute the entire agreement between you and us. Failure to enforce a provision is not a waiver. We may assign our rights and obligations. We are not liable for delays or failures beyond our reasonable control. If a provision is unlawful or unenforceable, it is severable and the remaining provisions remain effective. No joint venture, partnership, employment, or agency relationship is created by these Terms.</p>
            </section>

            <section>
              <h2 className={headingClass}>Contact us</h2>
              <p className="mt-4">To resolve a complaint or request more information about use of the Site, contact:</p>
              <address className="mt-4 border-l-2 border-[#c18d3d] pl-5 not-italic">Coastal Route Coffee<br />211 Calle Dorado<br />San Clemente, CA 92672<br />United States<br /><a className={linkClass} href="tel:+19494310683">949-431-0683</a><br /><a className={linkClass} href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a></address>
            </section>
          </div>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
