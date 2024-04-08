import { HttpException, Injectable, Logger } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User, 'OC') private userRepository: Repository<User>,
        private readonly logger: Logger,
        private jwtService:JwtService
    ) { }

    async login(userObject: LoginAuthDto) {
        const { user, password } = userObject;
        
        const findUser = await this.userRepository.findOneBy({SUSU_ID: user});

        if (!findUser) throw new HttpException('Usuario incorrecto', 403);
        
        const checkPassword = this.encryptPassword(password);

        if (checkPassword != findUser.SUSU_PWD) throw new HttpException('Contraseña incorrecta', 403);

        const payload = { id: (await findUser).SUSU_ID_REG}
        const token = this.jwtService.sign(payload);

        const resetPass:boolean = await this.validateUpdatePass(findUser.SUSU_UPDATE_PASS);
        
        const data = {
            resetPass,
            token
        };
        
        return data;
    }

    private validateUpdatePass(susuUpdatePass: Date): boolean{
        const currentDate = new Date();
        const updatedPassDate = new Date(susuUpdatePass);
        const differenceInMs = currentDate.getTime() - updatedPassDate.getTime();
        const daysPassed = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
        const resetPassThreshold = 30;
        let resetPass: boolean  = false;

        if (!susuUpdatePass || daysPassed > resetPassThreshold) {
            resetPass = true;
        }

        return resetPass;
    }

    public encryptPassword(password: string): string {
        let initKey = this.GetInitKey('1', true);
        initKey = this.Internal_EncryptInfo(initKey, "ZO7upap5KPu4jeO9GE+UMnkQHT6kUHtr2FT/yQYmins06srbyMggYjcEY/ns2slWTURobdSariTY=+-6aUVQ2SzRb=");
        const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(initKey, 'utf-8').slice(0, 16), Buffer.from(initKey, 'utf-8').slice(0, 16));
        let encryptedPassword = cipher.update(password, 'utf-8', 'base64');
        encryptedPassword += cipher.final('base64');
        return encryptedPassword;
    }
    
    private GetInitKey(complement: string, blMonths = false) {
        let result = "";
        let value = "1997/05/11";
        let array = ["Sundaynedelja(neh - DEH - lyah)", "Mondayponedeljek (poh-neh-DEH-lyehk)", "Tuesdaytorek (TOH-rehk)", "Wednesdaysreda (SREH-dah)", "Thursdayčetrtek (CHEH-tuhr-tehk)", "(PEH-tehk)", "Fridaypetek (PEH-tehk)", "Saturdaysobota (soh-BOH-tah)"];
        let array2 = ["JaneiroJanuarja(neh - DEH - lyah)", "FevereiroFebruarja(poh-neh-DEH-lyehk)", "MarçoMarca(TOH-rehk)", "AbrilAprila(SREH-dah)", "Maiomaja(CHEH-tuhr-tehk)", "JunhoJunija(PEH-tehk)", "JulhoJulija(PEH-tehk)", "AgostoAvgust(soh-BOH-tah)", "SetembroSeptembra(soh-BOH-tah)", "OutubroOktobra(soh-BOH-tah)", "NovembrNovembra(soh-BOH-tah)", "DezembroDecembra(sdesoh-BOH-tah)"];
        let array3 = new Array(30).fill("XEFRTGYH");
        let num = 5;
        let flag = false;
        
        try {
            for (let i = 0; i <= num; i++) {
                array3[i] = i.toString();
            }

            if (!complement) {
                complement = "";
            }

            if (complement.length === 0) {
                complement = "0";
            }

            let result2 = parseInt(complement) || 0;
            if (array3.includes(result2.toString())) {
                flag = true;
            }

            if (flag) {
                let now = new Date();
                now = new Date(value);
                now.setDate(now.getDate() + result2);
                let dayOfWeek = now.getDay();
                let month = now.getMonth() + 1;
                let year = now.getFullYear();

                if (blMonths) {
                    if (month > 12) {
                        month = 0;
                    }
                    result = year.toString(16) + array2[month];
                } else {
                    result = year.toString(16) + array[dayOfWeek];
                }
            }
        } catch (ex) {
            this.logger.error(ex);
        }

        return result;
    }
    
    private Internal_EncryptInfo(stTextToEncryp, stKey2See) {
        let result = "";
        try {
            if (stKey2See.trim() == "ZO7upap5KPu4jeO9GE+UMnkQHT6kUHtr2FT/yQYmins06srbyMggYjcEY/ns2slWTURobdSariTY=+-6aUVQ2SzRb=") {
                const key = Buffer.from("UjhQ23olDs324657", 'utf-8');
                const iv  = Buffer.from("UjhQ23olDs324657", 'utf-8'); 
                const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
                result = cipher.update(stTextToEncryp, 'utf-8', 'base64');
                result += cipher.final('base64');
            }
        } catch (ex) {
            this.logger.error(ex);
        }

        return result;
    }
}