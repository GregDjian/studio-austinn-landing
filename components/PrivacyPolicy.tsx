import React from "react";
import { Language } from "../types";

const PrivacyPolicy: React.FC<{ lang: Language }> = ({ lang }) => {
  const isAr = lang === "ar";
  const lastUpdated = "May 2026";

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-stone-50 py-20 px-6 md:px-14 lg:px-24"
    >
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-16 border-b border-stone-200 pb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-stone-400 mb-4">
          {isAr ? "الوثائق القانونية" : "Legal"}
        </p>
        <h1 className="font-sans font-black text-5xl md:text-6xl uppercase tracking-tighter text-stone-900 leading-[0.85] mb-6">
          {isAr ? (
            <>سياسة <span className="text-stone-300">الخصوصية</span></>
          ) : (
            <>Privacy <span className="text-stone-300">Policy</span></>
          )}
        </h1>
        <p className="font-serif italic text-stone-400 text-sm">
          {isAr ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
        </p>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto space-y-12 text-stone-600 text-[15px] leading-relaxed">

        {/* Intro */}
        <div>
          <p>
            {isAr
              ? "تلتزم Atelier Austinn، ومقرها دبي، الإمارات العربية المتحدة، بحماية خصوصيتك. توضح هذه السياسة كيفية جمع معلوماتك واستخدامها وحمايتها عند زيارتك لموقعنا."
              : "Atelier Austinn, based in Dubai, UAE, is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you visit our website."}
          </p>
        </div>

        {/* Section 1 */}
        <div>
          <h2 className="font-sans font-black text-lg uppercase tracking-tighter text-stone-900 mb-3">
            {isAr ? "١. المعلومات التي نجمعها" : "1. Information We Collect"}
          </h2>
          <p className="mb-3">
            {isAr
              ? "نجمع نوعين من المعلومات:"
              : "We collect two types of information:"}
          </p>
          <ul className="space-y-2 list-none">
            <li className="flex gap-3">
              <span className="text-stone-300 font-black mt-0.5">—</span>
              <span>
                <strong className="text-stone-800 font-bold">
                  {isAr ? "المعلومات التي تقدمها بنفسك:" : "Information you provide directly:"}
                </strong>{" "}
                {isAr
                  ? "عند ملء نموذج الاتصال أو الاستفسار، نجمع اسمك وعنوان بريدك الإلكتروني ومحتوى رسالتك."
                  : "When you fill out our contact or inquiry form, we collect your name, email address, and the content of your message."}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-stone-300 font-black mt-0.5">—</span>
              <span>
                <strong className="text-stone-800 font-bold">
                  {isAr ? "البيانات التي يتم جمعها تلقائيًا:" : "Automatically collected data:"}
                </strong>{" "}
                {isAr
                  ? "نستخدم Google Analytics لجمع بيانات الاستخدام المجهولة مثل الصفحات المُزارة ومدة الجلسة ونوع الجهاز والموقع الجغرافي التقريبي."
                  : "We use Google Analytics to collect anonymous usage data such as pages visited, session duration, device type, and approximate geographic location."}
              </span>
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div>
          <h2 className="font-sans font-black text-lg uppercase tracking-tighter text-stone-900 mb-3">
            {isAr ? "٢. كيف نستخدم معلوماتك" : "2. How We Use Your Information"}
          </h2>
          <ul className="space-y-2 list-none">
            {(isAr ? [
              "الرد على استفساراتك وطلباتك",
              "تحسين أداء الموقع وتجربة المستخدم",
              "تحليل أنماط استخدام الموقع بشكل مجمّع",
              "معالجة طلبات الاستفسار عبر خدمة Gemini AI لتوليد ردود تأكيد",
            ] : [
              "Respond to your inquiries and requests",
              "Improve website performance and user experience",
              "Analyse aggregated usage patterns",
              "Process inquiry submissions via Gemini AI to generate confirmation responses",
            ]).map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-stone-300 font-black mt-0.5">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3 */}
        <div>
          <h2 className="font-sans font-black text-lg uppercase tracking-tighter text-stone-900 mb-3">
            {isAr ? "٣. الخدمات التابعة لجهات خارجية" : "3. Third-Party Services"}
          </h2>
          <p className="mb-4">
            {isAr
              ? "نستخدم الخدمات الخارجية التالية، ولكل منها سياسة خصوصية خاصة بها:"
              : "We use the following third-party services, each governed by their own privacy policy:"}
          </p>
          <div className="space-y-4">
            {[
              {
                name: "Google Analytics",
                desc: isAr
                  ? "تحليلات الموقع. يجمع بيانات مجهولة الهوية حول سلوك الزوار. يمكنك إلغاء الاشتراك عبر إضافة المتصفح الخاصة بـ Google."
                  : "Website analytics. Collects anonymised visitor behaviour data. You may opt out via Google's browser add-on.",
                link: "https://policies.google.com/privacy",
              },
              {
                name: "Sanity CMS",
                desc: isAr
                  ? "نظام إدارة المحتوى الذي يستضيف صور وبيانات الأعمال الفنية على موقعنا."
                  : "Content management system that hosts the artwork images and content displayed on our site.",
                link: "https://www.sanity.io/legal/privacy",
              },
              {
                name: "Google Gemini AI",
                desc: isAr
                  ? "يُستخدم لمعالجة نماذج الاستفسار وتوليد ردود تأكيد مخصصة. قد تُرسل البيانات التي تدخلها في النموذج إلى واجهة برمجة Gemini."
                  : "Used to process inquiry forms and generate personalised confirmation responses. Data you enter in the inquiry form may be sent to the Gemini API.",
                link: "https://policies.google.com/privacy",
              },
            ].map((s) => (
              <div key={s.name} className="border-l-2 border-stone-200 pl-4">
                <p className="font-bold text-stone-800 text-sm mb-1">{s.name}</p>
                <p className="text-sm">{s.desc}</p>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-900 transition-colors mt-1 inline-block"
                >
                  {isAr ? "سياسة الخصوصية ←" : "Privacy Policy →"}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 */}
        <div>
          <h2 className="font-sans font-black text-lg uppercase tracking-tighter text-stone-900 mb-3">
            {isAr ? "٤. ملفات تعريف الارتباط (الكوكيز)" : "4. Cookies"}
          </h2>
          <p>
            {isAr
              ? "يستخدم موقعنا ملفات تعريف ارتباط من خلال Google Analytics لتتبع استخدام الموقع. يمكنك ضبط إعدادات متصفحك لرفض ملفات تعريف الارتباط، وإن كان ذلك قد يؤثر على بعض وظائف الموقع."
              : "Our website uses cookies through Google Analytics to track site usage. You may configure your browser to refuse cookies, though this may affect certain site functionality."}
          </p>
        </div>

        {/* Section 5 */}
        <div>
          <h2 className="font-sans font-black text-lg uppercase tracking-tighter text-stone-900 mb-3">
            {isAr ? "٥. الاحتفاظ بالبيانات" : "5. Data Retention"}
          </h2>
          <p>
            {isAr
              ? "نحتفظ ببيانات نموذج الاتصال فقط طالما كانت ضرورية للرد على استفساراتك. لا نبيع بياناتك الشخصية أو نؤجرها أو نتاجر بها لأي طرف ثالث."
              : "We retain contact form data only for as long as necessary to respond to your inquiry. We do not sell, rent, or trade your personal data to any third party."}
          </p>
        </div>

        {/* Section 6 */}
        <div>
          <h2 className="font-sans font-black text-lg uppercase tracking-tighter text-stone-900 mb-3">
            {isAr ? "٦. حقوقك" : "6. Your Rights"}
          </h2>
          <p className="mb-3">
            {isAr
              ? "وفقًا للقوانين المعمول بها في الإمارات العربية المتحدة، يحق لك:"
              : "Under applicable UAE law, you have the right to:"}
          </p>
          <ul className="space-y-2 list-none">
            {(isAr ? [
              "طلب الاطلاع على البيانات الشخصية التي نحتفظ بها عنك",
              "طلب تصحيح أو حذف بياناتك الشخصية",
              "سحب موافقتك على المعالجة في أي وقت",
            ] : [
              "Request access to the personal data we hold about you",
              "Request correction or deletion of your personal data",
              "Withdraw consent for processing at any time",
            ]).map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-stone-300 font-black mt-0.5">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 7 */}
        <div>
          <h2 className="font-sans font-black text-lg uppercase tracking-tighter text-stone-900 mb-3">
            {isAr ? "٧. التواصل معنا" : "7. Contact Us"}
          </h2>
          <p>
            {isAr
              ? "إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يُرجى التواصل معنا على:"
              : "If you have any questions about this privacy policy, please contact us at:"}
          </p>
          <div className="mt-4 border border-stone-200 p-6 bg-white">
            <p className="font-sans font-black text-stone-900 uppercase tracking-tighter text-lg">Studio Austinn</p>
            <p className="text-sm text-stone-500 mt-1">Dubai, United Arab Emirates</p>
            <a
              href="mailto:hello@studioaustinn.com"
              className="text-[11px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-900 transition-colors mt-2 inline-block"
            >
              hello@studioaustinn.com
            </a>
          </div>

        </div>

        {/* Footer note */}
        <div className="border-t border-stone-200 pt-8">
          <p className="text-xs text-stone-400 font-serif italic">
            {isAr
              ? "تحتفظ Studio Austinn بالحق في تحديث هذه السياسة في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة مع تاريخ التحديث."
              : "Studio Austinn reserves the right to update this policy at any time. Any changes will be posted on this page with a revised date."}
          </p>
        </div>

      </div>
    </section>
  );
};

export default PrivacyPolicy;