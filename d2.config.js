const config = {
  type: "app",
  name: "Minister's Dashboards",
  title: " Minister's Dashboards",
  description: "Minister's Dashboards",
  entryPoints: {
    app: "./src/AppWrapper.js",
  },
  customAuthorities: ["IDVT_ADMINISTRATION", "IDVT_DASHBOARD"],
};

module.exports = config;
