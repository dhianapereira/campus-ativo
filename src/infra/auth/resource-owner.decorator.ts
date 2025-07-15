import { SetMetadata } from '@nestjs/common'

export const RESOURCE_OWNER_KEY = 'resourceOwner'
export const ResourceOwner = (resourceType: string) => SetMetadata(RESOURCE_OWNER_KEY, resourceType)