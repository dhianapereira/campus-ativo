import { Location } from "@/domain/maintenance-problems/enterprise/entities/location";

export class LocationPresenter {
  static toHTTP(location: Location) {
    return {
      id: location.id.toValue(),
      name: location.name,
      code: location.code,
      description: location.description,
      isActive: location.isActive,
    };
  }
}
