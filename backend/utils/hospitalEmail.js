function buildHospitalWelcomeHtml({ hospitalName, regNo, loginEmail, password, loginUrl }) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #222;">
    <h2 style="color: #0b5d3b;">Welcome to HMS</h2>
    <p>Dear <strong>${hospitalName}</strong>,</p>
    <p>Aapka hospital HMS par register ho gaya hai. Neeche aapke login details aur registration certificate (PDF) attached hai.</p>

    <table style="border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 6px 12px; border: 1px solid #ddd;"><strong>Registration No.</strong></td><td style="padding: 6px 12px; border: 1px solid #ddd;">${regNo}</td></tr>
      <tr><td style="padding: 6px 12px; border: 1px solid #ddd;"><strong>Login Email</strong></td><td style="padding: 6px 12px; border: 1px solid #ddd;">${loginEmail}</td></tr>
      <tr><td style="padding: 6px 12px; border: 1px solid #ddd;"><strong>Password</strong></td><td style="padding: 6px 12px; border: 1px solid #ddd;">${password}</td></tr>
    </table>

    <p>Login: <a href="${loginUrl}">${loginUrl}</a></p>
    <p style="color: #b00020;"><strong>Pehli baar login karne ke baad password change kar dein.</strong></p>
    <p>Regards,<br/>HMS Team</p>
  </div>`;
}

module.exports = { buildHospitalWelcomeHtml };