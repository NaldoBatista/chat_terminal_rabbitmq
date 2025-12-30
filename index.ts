import type { ChannelModel, Channel } from 'amqplib'
import { stdin, stdout } from 'node:process'
import readline from 'node:readline/promises'

import ConnectionFactory from './ConnectionFactory.ts'
import Usuario from './Usuario.ts'

async function main() {
    const connectionFactory = new ConnectionFactory()
    const connection: ChannelModel = await connectionFactory.create()
    const channel: Channel = await connection.createChannel()
    
    const readInputLine = readline.createInterface({ input: stdin, output: stdout })
    
    let nomeUsuario: string = await readInputLine.question("Informe seu usuário: ")
    let usuario: Usuario = new Usuario(nomeUsuario)

    await channel.assertQueue(usuario.nomeFila, {durable: true})
    
    let nomeDestinatario: string = await readInputLine
        .question(`Olá ${usuario.nomeUsuario}, com quem deseja conversar? `)
    let destinatario: Usuario = new Usuario(nomeDestinatario)
    await channel.assertQueue(destinatario.nomeFila, {durable: true})
    
    let conversa: Array<string> = []
    let sair: Boolean = false

    while (!sair) {
        receberMesagem(usuario, channel, conversa)
        mostraConversa(conversa)

        let opcao: string = await readInputLine.
            question(
                `${usuario.nomeUsuario}, selecione a ação que desja realizar [1]:`
                + '\n 1- Atualizar mensagens'
                + `\n 2- Enviar mensagem para ${destinatario.nomeUsuario}`
                + '\n 3- Trocar destinatario'
                + '\n 4- Sair => '
            )
        console.clear()
        
        switch(opcao) {
            case '':
            case '1':
                break
            case '2':
                let mensagem: string = await enviarMensagem(readInputLine, usuario, destinatario, channel)
                let data = new Date()
                
                conversa.push(`${destinatario.nomeUsuario} - ${data.toLocaleString('pt-BR')} << ${mensagem}`)

                break
            case '3':
                let nomeNovoDestinatatio = await readInputLine
                    .question('Informe o nome do novo destinatário: ')
                
                destinatario = new Usuario(nomeNovoDestinatatio)
                await channel.assertQueue(destinatario.nomeFila, {durable: true})
                
                break
            case '4':
                await channel.close()
                await connection.close()
                readInputLine.close()
                sair = true
                break
            default:
                console.log('Opção não localizada!')
                break
        }
    }
}

async function enviarMensagem(
    readline: readline.Interface,
    usuario: Usuario,
    destinatario: Usuario,
    channel: Channel
): Promise<string> {
    let mensagem: string = await readline.question(`${destinatario.nomeUsuario} << `)
    let data = new Date()
    
    let enviada: boolean = channel.publish(
        '', 
        destinatario.nomeFila, 
        Buffer.from(mensagem),
        {
            persistent: true,
            headers: {
                remetente: usuario.nomeUsuario,
                data_hora: data.toLocaleString('pt-BR')
            } 
        }
    )

    if (!enviada) {
        console.log('Falha ao enviar mensagem.')
        return ''
    }

    return mensagem
}

async function receberMesagem(
    usuario: Usuario,
    channel: Channel,
    conversa: Array<string>
) {
    await channel.consume(usuario.nomeFila, (data) => {
        if (data) {
            let nomeRemetente: string | undefined = data
                .properties
                .headers?.['remetente']
            let dataHora: string | undefined = data
                .properties
                .headers?.['data_hora']

            let mensagem: string = `${nomeRemetente} - ${dataHora} >> ` + data.content.toString()
            channel.ack(data)

            conversa.push(mensagem)
        }
    })
}

function mostraConversa(conversa: Array<string>) {
    console.log('*** mensagens ****')
    conversa.forEach(mensagem => {
        console.log(mensagem)
    })
    console.log('\n')
}

main()