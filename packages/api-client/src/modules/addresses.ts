import type { Address, AddressCreateInput } from "@iiiiibox/shared-types";
import type { ApiClient } from "../client";

export function createAddressesModule(client: ApiClient) {
  return {
    listMine: () => client.get<Address[]>("/addresses"),
    create: (input: AddressCreateInput) => client.post<Address>("/addresses", input),
  };
}
