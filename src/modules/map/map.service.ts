import { Injectable } from '@nestjs/common';
import { MapDto } from './dto/map.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientUbication } from './entities/client-ubication.entity';
import { UserLoginDto } from 'src/dtos-globals/user-login.dto';
import { PageOptionsDto } from 'src/dtos-globals/page-options.dto';
import { PageDto } from 'src/dtos-globals/page.dto';
import { PageMetaDto } from 'src/dtos-globals/page-meta.dto';
import { Client } from './entities/client.entity';
import { User } from '../user/entities/user.entity';
import { ServicesForClientDto } from './dto/services-for-client.dto';
import { LineServicesForClientDto } from './dto/line-services-for-client.dto';
import { LineService } from './entities/line-service.entity';

@Injectable()
export class MapService {
  constructor(
    @InjectRepository(User, 'OC') private repositoryUser: Repository<User>,
    @InjectRepository(ClientUbication, 'COP') private repositoryClientUbic: Repository<ClientUbication>,
    @InjectRepository(Client, 'COP') private repositoryClient: Repository<Client>
  ) { }

  public async getUbications(mapDto: MapDto, user: UserLoginDto): Promise<ClientUbication[]> {
    const infoUser = await this.repositoryUser.createQueryBuilder('users')
      .leftJoinAndSelect('users.userZone', 'userZone')
      .where({SUSU_ID_REG: user.userId})
      .getOne();
    
    const { CLIUBIC_ID_CLIENT } = mapDto;
    const { SUZ_LIMIT_LATITUD_SUR, SUZ_LIMIT_LATITUD_NORTE, SUZ_LIMIT_LONGITUD_ESTE, SUZ_LIMIT_LONGITUD_OESTE } = infoUser?.userZone;

    const queryBuilder = await this.repositoryClientUbic.createQueryBuilder('clientUbication')
      .leftJoinAndSelect('clientUbication.client', 'infoClient')
      .andWhere('CAST(clientUbication.CLIUBIC_LATITUD AS FLOAT) > :limitLatitudSur', { limitLatitudSur: parseFloat(SUZ_LIMIT_LATITUD_SUR) })
      .andWhere('CAST(clientUbication.CLIUBIC_LATITUD AS FLOAT) < :limitLatitudNorte', { limitLatitudNorte: parseFloat(SUZ_LIMIT_LATITUD_NORTE) })
      .andWhere('CAST(clientUbication.CLIUBIC_LONGITUD AS FLOAT) > :limitLongitudOeste', { limitLongitudOeste: parseFloat(SUZ_LIMIT_LONGITUD_OESTE) })
      .andWhere('CAST(clientUbication.CLIUBIC_LONGITUD AS FLOAT) < :limitLongitudEste', { limitLongitudEste: parseFloat(SUZ_LIMIT_LONGITUD_ESTE) });

    if (CLIUBIC_ID_CLIENT) {
      queryBuilder.andWhere({ CLIUBIC_ID_CLIENTE: CLIUBIC_ID_CLIENT });
    }

    const data = await queryBuilder.getMany();

    return data;
  }

  public async getClients(pageOptionsDto: PageOptionsDto): Promise<PageDto<Client>> {
    const queryBuilder = await this.repositoryClient.createQueryBuilder("clients")
      .select(['clients.CLIE_ID_REG', 'clients.CLIE_COMERCIAL'])
      .orWhere('clients.CLIE_COMERCIAL LIKE :CLIE_COMERCIAL', { CLIE_COMERCIAL: `%${pageOptionsDto.term}%` })
      .orderBy("clients.CLIE_ID_REG", pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  public async getLinesServicesForClient(lineServicesForClientDto: LineServicesForClientDto): Promise<any[]> {
    const { CLIE_ID_REG } = lineServicesForClientDto;

    const data = await this.repositoryClient.createQueryBuilder('client')
        .leftJoinAndSelect('client.document', 'document')
        .leftJoinAndSelect('document.documentService', 'documentService')
        .leftJoinAndSelect('documentService.inventoryTree', 'inventoryTree')
        .leftJoinAndSelect('inventoryTree.lineService', 'lineService')
        .where({ CLIE_ID_REG: CLIE_ID_REG })
        .getOne();

    const lineServices: any[] = await this.getLineServicesFromData(data);

    const lineServicesGroup: any[] = await this.getLineServicesGroup(lineServices);

    return lineServicesGroup;
  }
  
  private async getLineServicesFromData(data: any): Promise<any[]> {
    const lineServices: any[] = [];

    if (data && data.document) {
        for (const document of data.document) {
            if (document && document.documentService) {
                for (const documentService of document.documentService) {
                    if (documentService && documentService.inventoryTree) {
                        if (Array.isArray(documentService.inventoryTree)) {
                            for (const tree of documentService.inventoryTree) {
                                if (tree && tree.lineService) {
                                    lineServices.push(tree.lineService);
                                }
                            }
                        } else {
                            if (documentService.inventoryTree.lineService) {
                                lineServices.push(documentService.inventoryTree.lineService);
                            }
                        }
                    }
                }
            }
        }
    }

    return lineServices;
  }

  private async getLineServicesGroup(lineServices: any){
    const uniqueLineServices = lineServices.reduce((accumulator, currentValue) => {
      if (!accumulator[currentValue.LINSER_ID_REG]) {
          accumulator[currentValue.LINSER_ID_REG] = {
              "LINSER_ID_REG": currentValue.LINSER_ID_REG,
              "LINSER_NAME": currentValue.LINSER_NAME,
              "count": 1
          };
      } else {
          accumulator[currentValue.LINSER_ID_REG].count++;
      }
      return accumulator;
    }, {});
    
    const result = Object.values(uniqueLineServices);

    return result;
  }

  public async getServicesForClient(servicesForClientDto: ServicesForClientDto): Promise<any> {
    const { CLIE_ID_REG, LINSER_ID_REG } = servicesForClientDto;

    const data = await this.repositoryClient.createQueryBuilder('client')
        .leftJoinAndSelect('client.document', 'document')
        .leftJoinAndSelect('document.documentService', 'documentService')
        .leftJoinAndSelect('documentService.inventoryTree', 'inventoryTree')
        .leftJoinAndSelect('inventoryTree.lineService', 'lineService')
        .where('client.CLIE_ID_REG = :CLIE_ID_REG', { CLIE_ID_REG })
        .andWhere('lineService.LINSER_ID_REG = :LINSER_ID_REG', { LINSER_ID_REG })
        .getOne();

    const inventoryTrees: any[] = await this.getInventoryTreesFromData(data);

    const inventoryTreesGroup: any = await this.getInventoryTreesGroup(inventoryTrees);

    return inventoryTreesGroup;
  }

  private async getInventoryTreesFromData(data: any): Promise<any[]> {
    const inventoryTrees: any[] = [];

    if (data && data.document) {
        for (const document of data.document) {
            if (document && document.documentService) {
                for (const documentService of document.documentService) {
                    if (documentService && documentService.inventoryTree) {
                        inventoryTrees.push(documentService.inventoryTree);
                    }
                }
            }
        }
    }

    return inventoryTrees;
  }

  private async getInventoryTreesGroup(inventoryTrees: any): Promise<any> {
    return Object.values(inventoryTrees.reduce((acc, curr) => {
      if (!acc[curr.ARBOL_INVE_ID_REG]) {
          acc[curr.ARBOL_INVE_ID_REG] = curr;
      }
      return acc;
    }, {}));
  }
}