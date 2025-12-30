export default class Usuario {
    
    private usuario: string;

    constructor(usuario: string) {
        this.usuario = usuario;
    }

    get nomeUsuario(): string {
        return this.usuario;
    }

    get nomeFila(): string {
        return 'queue_' + this.usuario;
    }
}