import "../css/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} UniLink EDI. Example estimator – customize tier values and fees to match your agreement.
    </footer>
  );
}
