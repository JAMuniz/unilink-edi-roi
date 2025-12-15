import logo from "../img/Unilink-Logo2022 NO WHITE BOX-VECTOR.png";
import "../css/Header.css";

export default function Header() {
  return (
    <>
      {/* Sticky header */}
      <header className="site-header">
        <div className="header-container">
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
