import HelpCenter from "./HelpCenter"; // adjust the path if needed

const Footer = () => {
  return (
    <footer className="bg-blue-50 py-10 font-arial mt-6">
      <div className="container mx-auto px-3 text-center text-black font-mono">
        <p>© 2025 Wealthory. All rights reserved.</p>
        <p>AI-powered financial intelligence for smarter, safer decisions.</p>

        <div className="mt-4 text-sm">
          <p className="mt-2">
            📧 Contact us:{" "}
            <a href="mailto:support@wealthory.com" className="underline">
              support@wealthory.com
            </a>
          </p>
          <p className="mt-2">📞 Call: +91 XXXXX XXX88</p>
          <p className="mt-2">💬 We'd love to hear from you — reach out anytime!</p>
          <p className="mt-2">
            ❓ Having issues? Visit our Help Center or contact support.
          </p>
          <p className="mt-2 font-bold">
            Our Help Center name at all locations is : <span className="text-blue-800">Wealthory-Finance</span>
          </p>

          {/* 👇 Add HelpCenter component here */}
          <div className="mt-4 flex justify-center">
            <HelpCenter />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
