import logo from "../img/Unilink-Logo2022 NO WHITE BOX-VECTOR.png";
import { Download } from "lucide-react";
import "../css/Header.css";

interface HeaderProps {
  exportToPDF?: () => void;
}

export default function Header({ exportToPDF }: HeaderProps) {
  return (
    <>
      {/* Sticky header */}
      <header className="site-header">
        <div className="header-container">
          <div className="header-branding">
            <a
              href="https://www.edisaves.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="logo-link"
            >
              <img src={logo} alt="UniLink Logo" className="logo" />
            </a>
            <h1 className="site-title">EDI ROI Calculator</h1>
          </div>
          {exportToPDF && (
            <button
              onClick={exportToPDF}
              className="export-button"
              title="Export the analysis to PDF"
            >
              <Download size={20} />
              <span>Export to PDF</span>
            </button>
          )}
        </div>
      </header>

      <section aria-labelledby="instructions-title" className="instructions">
        <div className="instructions-container">
          <div className="instructions-card">
            <h2 id="instructions-title" className="instructions-heading">Instructions:</h2>
            <ol className="instructions-list">
              <li>
                Please enter the <strong><u>number of documents</u></strong> per Trading Partner in the <strong>Monthly Document Volumes</strong> table and 
                <strong> <u>manual time per document/transaction</u></strong> in the <strong>Manual Process & Labor</strong> table.
                Also enter your hourly cost for your staff.
              </li>
              <li>
                Please remove or add Trading Partner columns as needed.
              </li><li>
                Please remove or add Document Type rows as needed.
              </li>
              <li>
                The results will be shown in the <strong>Results & Detail</strong> table at the very bottom.
              </li>
            </ol>
          </div>
        </div>
        <div className="instructions-note-container">
          <p className="instructions-note">Note: We refer to Documents as Transactions</p>
        </div>
      </section>
    </>
  );
}
