import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { User } from "src/modules/user/entities/user.entity";
import { UserZone } from "src/modules/map/entities/user-zone.entity";

export const OcMssqlConfig = (host: string, port:string, database: string, username: string, password: string): 
TypeOrmModuleOptions =>  {
    return {
        name: 'OC',
        type: 'mssql',
        host: host,
        port: parseInt(port),
        username: username,
        password: password,
        database: database,
        entities: [User, UserZone],
        synchronize: false,
        logging: false
    }
}