import nodemailer from 'nodemailer';
import 'dotenv/config';

// Configura el "transportador" de correo usando las credenciales de tu archivo .env
const transporter = nodemailer.createTransport({
    service: 'gmail', // Puedes usar 'outlook', 'yahoo', etc. o un servicio profesional
    auth: {
        user: process.env.EMAIL_USER, // El correo desde el que enviarás los códigos
        pass: process.env.EMAIL_PASS, // La contraseña de aplicación de ese correo
    },
});

export const sendVerificationEmail = async (to, code) => {
    const mailOptions = {
        from: `"K-Store Soporte" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Tu Código de Verificación de K-Store',
        html: `
            <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
                <h2>Recuperación de Contraseña</h2>
                <p>Has solicitado restablecer tu contraseña. Usa el siguiente código para continuar:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 8px;">
                    ${code}
                </p>
                <p>Este código expirará en 10 minutos.</p>
                <p>Si no solicitaste esto, puedes ignorar este correo de forma segura.</p>
                <hr/>
                <p style="font-size: 12px; color: #888;">K-Store</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo de verificación enviado a ${to}`);
    } catch (error) {
        console.error(`Error al enviar correo a ${to}:`, error);
        throw new Error('No se pudo enviar el correo de verificación.');
    }
};