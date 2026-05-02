import React from "react";
import styles from "../../css/main.module.css";

const Sidebar = () => (
  <aside className={styles.sidebar}>
    <nav>
      {["Home", "Markets", "PCA", "Correlation", "History", "Profile"].map(
        (item) => (
          <a
            key={item}
            href={`/${item.toLowerCase()}`}
            className={styles.navItem}
          >
            {item}
          </a>
        ),
      )}
    </nav>
  </aside>
);

export default Sidebar;
