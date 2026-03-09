// Mock schema events and tables

export let events = {
  userCreated: jest.fn((data: any) => ({
    type: "v1.UserCreated",
    data,
  })),
  userUpdated: jest.fn((data: any) => ({
    type: "v1.UserUpdated",
    data,
  })),
  usageRecorded: jest.fn((data: any) => ({
    type: "v1.UsageRecorded",
    data,
  })),
  plantCreated: jest.fn((data: any) => ({
    type: "v1.PlantCreated",
    data,
  })),
  plantUpdated: jest.fn((data: any) => ({
    type: "v1.PlantUpdated",
    data,
  })),
  plantDeleted: jest.fn((data: any) => ({
    type: "v1.PlantDeleted",
    data,
  })),
  messageCreated: jest.fn((data: any) => ({
    type: "v1.MessageCreated",
    data,
  })),
};

export let tables = {
  user: {
    where: jest.fn((conditions: any) => ({ __table: "user", __conditions: conditions })),
  },
  usage: {
    where: jest.fn((conditions: any) => ({ __table: "usage", __conditions: conditions })),
  },
  plants: {
    where: jest.fn((conditions: any) => ({ __table: "plants", __conditions: conditions })),
  },
  chatMessages: {
    where: jest.fn((conditions: any) => ({
      __table: "chatMessages",
      __conditions: conditions,
    })),
  },
};

export let schema = {};
