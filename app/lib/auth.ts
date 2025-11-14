const CryptoJS = require('crypto-js');

/**
 * Genera un hash SHA-256 de la contraseña proporcionada
 */
export function hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
}

/**
 * Verifica si una contraseña coincide con su hash
 */
export function verifyPassword(password: string, hash: string): boolean {
    const hashedAttempt = hashPassword(password);
    return hashedAttempt === hash;
}

/**
 * Valida que una contraseña cumpla con los requisitos mínimos:
 * - Al menos 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) {
        return {
            isValid: false,
            message: 'La contraseña debe tener al menos 8 caracteres'
        };
    }

    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'La contraseña debe incluir al menos una letra mayúscula'
        };
    }

    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            message: 'La contraseña debe incluir al menos una letra minúscula'
        };
    }

    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            message: 'La contraseña debe incluir al menos un número'
        };
    }

    return { isValid: true };
}

/**
 * Valida que un nombre de usuario cumpla con los requisitos:
 * - Entre 3 y 20 caracteres
 * - Solo letras, números y guiones bajos
 * - Debe comenzar con una letra
 */
export function validateUsername(username: string): { isValid: boolean; message?: string } {
    if (username.length < 3 || username.length > 20) {
        return {
            isValid: false,
            message: 'El nombre de usuario debe tener entre 3 y 20 caracteres'
        };
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
        return {
            isValid: false,
            message: 'El nombre de usuario solo puede contener letras, números y guiones bajos, y debe comenzar con una letra'
        };
    }

    return { isValid: true };
}

// Exportación por defecto que contiene todas las funciones de autenticación
export default {
    hashPassword,
    verifyPassword,
    validatePassword,
    validateUsername
};