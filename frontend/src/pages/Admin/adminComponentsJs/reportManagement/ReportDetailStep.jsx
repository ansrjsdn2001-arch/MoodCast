import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { DrawerHeader } from "./ReportDrawerHeader";
import styles from "../../adminComponentsCss/reportManagement/ReportDetailStep.module.css";

export function ReportDetailStep({ report, onClose, onProcess }) {
  return (
    <>
      <DrawerHeader title={report.title} onClose={onClose} />

      <div className={styles.drawerBody}>
        <section className={styles.detailSection}>
          <h3>{"\uC2E0\uACE0 \uAC1C\uC694"}</h3>
          <div className={styles.overviewCard}>
            <div className={styles.profileThumb}>
              <PersonOutlineOutlinedIcon />
            </div>
            <dl>
              <div>
                <dt>{"\uC2E0\uACE0 \uB300\uC0C1"}</dt>
                <dd>
                  <strong>{report.targetName}</strong>
                  <span>{report.targetHandle}</span>
                </dd>
              </div>
              <div>
                <dt>{"\uC2E0\uACE0 \uC218"}</dt>
                <dd>{report.reportCount}{"\uAC74"}</dd>
              </div>
              <div>
                <dt>{"\uCD5C\uCD08 \uC2E0\uACE0"}</dt>
                <dd>{report.firstReportedAt}</dd>
              </div>
              <div>
                <dt>{"\uCD5C\uADFC \uC2E0\uACE0"}</dt>
                <dd>{report.latestReportedAt}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={styles.detailSection}>
          <h3>{"\uC2E0\uACE0 \uC0AC\uC720"}</h3>
          <strong className={styles.reasonText}>{report.reason}</strong>
          <p>{report.detail}</p>
        </section>

        <section className={styles.detailSection}>
          <div className={styles.sectionHead}>
            <h3>
              {"\uC2E0\uACE0\uC790"}({report.reportCount})
            </h3>
            <button type="button">{"\uC804\uCCB4 \uBCF4\uAE30"}</button>
          </div>
          <div className={styles.reporterList}>
            {(report.reporters || []).map((reporter, index) => (
              <div key={reporter}>
                <span>{index + 1}</span>
                <strong>{reporter}</strong>
                <small>{index + 2}{"\uC2DC\uAC04 \uC804"}</small>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.detailSection}>
          <h3>{"\uB300\uC0C1 \uC0AC\uC6A9\uC790 \uC815\uBCF4"}</h3>
          <div className={styles.userInfoCard}>
            <div>
              <strong>{report.targetName}</strong>
              <span>{report.targetHandle}</span>
            </div>
            <dl>
              <div>
                <dt>{"\uAC00\uC785\uC77C"}</dt>
                <dd>{report.joinedAt}</dd>
              </div>
              <div>
                <dt>{"\uAC8C\uC2DC\uAE00"}</dt>
                <dd>{report.postCount}</dd>
              </div>
              <div>
                <dt>{"\uB313\uAE00"}</dt>
                <dd>{report.commentCount}</dd>
              </div>
              <div>
                <dt>{"\uC88B\uC544\uC694"}</dt>
                <dd>{report.likeCount}</dd>
              </div>
              <div>
                <dt>{"\uC2E0\uACE0 \uD69F\uC218"}</dt>
                <dd>{"\uC5F0\uACB0 \uC608\uC815"}</dd>
              </div>
              <div>
                <dt>{"\uACBD\uACE0 \uD69F\uC218"}</dt>
                <dd>{"\uC5F0\uACB0 \uC608\uC815"}</dd>
              </div>
              <div>
                <dt>{"\uC815\uC9C0 \uD69F\uC218"}</dt>
                <dd>{"\uC5F0\uACB0 \uC608\uC815"}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={styles.detailSection}>
          <h3>{"\uCD5C\uADFC \uD65C\uB3D9"}</h3>
          <ul className={styles.activityList}>
            {(report.activities || []).length > 0 ? (
              (report.activities || []).map((activity) => (
                <li key={activity.id || `${activity.type}-${activity.time}`}>
                  <strong>{activity.type}</strong>
                  <span>{activity.text}</span>
                  <time>{activity.time}</time>
                </li>
              ))
            ) : (
              <li className={styles.emptyActivity}>
                {"\uCD5C\uADFC \uD65C\uB3D9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
              </li>
            )}
          </ul>
        </section>
      </div>

      <footer className={styles.drawerFooter}>
        <button className={styles.secondaryButton} type="button">
          {"\uC804\uCCB4 \uD65C\uB3D9 \uBCF4\uAE30"}
        </button>
        <button className={styles.primaryButton} type="button" onClick={onProcess}>
          {"\uC2E0\uACE0 \uAC80\uD1A0 \uBC0F \uCC98\uB9AC"}
        </button>
      </footer>
    </>
  );
}
