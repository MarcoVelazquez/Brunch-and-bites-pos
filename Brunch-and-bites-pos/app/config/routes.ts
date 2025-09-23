interface RouteConfig {
    path: string;
    permission?: string;
    title: string;
}

const routes: { [key: string]: RouteConfig } = {
    caja: {
        path: '/caja',
        permission: 'COBRAR',
        title: 'Caja'
    },
    productos: {
        path: '/productos',
        permission: 'GESTIONAR_PRODUCTOS',
        title: 'Productos'
    },
    usuarios: {
        path: '/usuarios',
        permission: 'GESTIONAR_USUARIOS',
        title: 'Usuarios'
    },
    permisos: {
        path: '/permisos',
        permission: 'DAR_PERMISOS',
        title: 'Gestión de Permisos'
    },
    gastos: {
        path: '/gastos',
        permission: 'GESTIONAR_GASTOS',
        title: 'Gastos'
    },
    costeos: {
        path: '/costeos',
        permission: 'GESTIONAR_COSTEOS',
        title: 'Costeos'
    },
    recibos: {
        path: '/recibos',
        permission: 'VER_RECIBOS',
        title: 'Recibos'
    },
    reportes: {
        path: '/reportes',
        permission: 'VER_REPORTES',
        title: 'Reportes'
    },
    login: {
        path: '/login',
        title: 'Iniciar Sesión'
    },
    register: {
        path: '/usuarios/register',
        permission: 'CREAR_USUARIOS',
        title: 'Registro de Usuario'
    }
};

export { routes };
export default routes;