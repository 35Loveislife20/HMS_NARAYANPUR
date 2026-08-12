import "./StatsCards.css";

const StatsCards = () => {

    const stats = [
        {
            title: "Total Patients",
            value: "248",
            icon: "👥",
            change: "+12%",
        },
        {
            title: "Total Doctors",
            value: "32",
            icon: "🩺",
            change: "+4%",
        },
        {
            title: "Appointments",
            value: "86",
            icon: "📅",
            change: "+18%",
        },
        {
            title: "Revenue",
            value: "₹45,820",
            icon: "💰",
            change: "+9%",
        },
    ];

    return (
        <div className="stats-grid">

            {stats.map((stat) => (
                <div
                    className="stat-card"
                    key={stat.title}
                >

                    <div className="stat-top">

                        <div className="stat-icon">
                            {stat.icon}
                        </div>

                        <span className="stat-change">
                            {stat.change}
                        </span>

                    </div>

                    <h3>{stat.value}</h3>

                    <p>{stat.title}</p>

                </div>
            ))}

        </div>
    );
};

export default StatsCards;