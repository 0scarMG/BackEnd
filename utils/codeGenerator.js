// Genera un código numérico simple de 6 dígitos.
export const generateLockerCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};