import Image from "next/image";
import styles from "./DashboardPage.module.css";
import Link from "next/link";

export default function DashboardPage() {
        // Mock data for demonstration purposes
  const myTrips = [
    { id: 1, name: "Summer Vacation", members: "Erica, Michael, Andrew, Luana" },
    { id: 2, name: "Winter Vacation", members: "Sarah, Mike, Lana" },
    { id: 3, name: "Weekend Trip", members: "Kevin, Michaela" },
    { id: 4, name: "Solo Getaway", members: "Just Me" },
  ];

  const sharedTrips = [
    { id: 5, name: "Friends Trip", members: "Liam, Emma" },
    { id: 6, name: "Romantic", members: "Lucas" },
    { id: 7, name: "Theaters!", members: "Adrian, Nora" },
    { id: 8, name: "DaVinci Time", members: "Theo" },
    { id: 9, name: "Beach pls", members: "Mila, Hannah" },
    { id: 10, name: "Culture or sth.", members: "Tobias, Lea" },
  ];
  return (
    <div className={styles.pageWrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.logoWrapper}>
          <Image src="/logo.png" alt="TripSync logo" width={170} height={48} priority />
        </div>

        <nav className={styles.nav}>
          <a className={`${styles.navItem} ${styles.active}`} href="#">
            <span className={styles.navIcon}>⌂</span>
            <span>Home</span>
          </a>
          <a className={styles.navItem} href="#my-trips">
            <span className={styles.navIcon}>✈</span>
            <span>My Trips</span>
          </a>
          <a className={styles.navItem} href="#shared-trips">
            <span className={styles.navIcon}>🔗</span>
            <span>Shared Trips</span>
          </a>
        </nav>

        <div className={styles.profileCard}>
          <div className={styles.profileAvatar} />
          <div> {/*mock data to be replaced*/}
            <p className={styles.profileName}>Erica</p>
            <p className={styles.profileMail}>erica@gmail.com</p>
          </div>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div />
          <div className={styles.headerActions}>
            <button className={styles.secondaryButton} type="button">
              Join Trip
            </button>
            <button className={styles.primaryButton} type="button">
              Create Trip
            </button>
          </div>
        </header>

        {myTrips.length === 0 && sharedTrips.length === 0 ? (
          <section className={styles.emptyState}>
            <h1 className={styles.emptyStateTitle}>Need a Vacation?</h1>
            <p className={styles.emptyStateSubtitle}>Create or join one with TripSync</p>
          </section>
        ) : (
          <>
            <section 
              id="my-trips"
              className={styles.section}>
              <h1 className={styles.pageTitle}>My Trips</h1>
              <p className={styles.sectionDescription}>You are the owner of these trips.</p>

              <div className={styles.tripGridFour}>
                {myTrips.map((trip) => (
                  <Link key={trip.id} 
                    href={`/trips/${trip.id}`}
                    className={styles.tripCard}>
                    <div className={styles.tripImagePlaceholder} />
                    <h3 className={styles.tripTitle}>{trip.name}</h3>
                    <p className={styles.tripMembers}>{trip.members}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section 
              id="shared-trips"
              className={styles.section}>
              <h2 className={styles.sectionTitle}>Shared Trips</h2>
              <p className={styles.sectionDescription}>You&apos;re a guest in these trips.</p>

              <div className={styles.tripGridSix}>
                {sharedTrips.map((trip) => (
                  <Link 
                    key={trip.id} 
                    href={`/trips/${trip.id}`}
                    className={styles.tripCard}>
                    <div className={styles.tripImagePlaceholderSmall} />
                    <h3 className={styles.tripTitleSmall}>{trip.name}</h3>
                    <p className={styles.tripMembers}>{trip.members}</p>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}