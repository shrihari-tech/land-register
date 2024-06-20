const { expect } = require("chai");

describe("LandRegistry", function () {
  let LandRegistry;
  let landRegistry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    landRegistry = await LandRegistry.deploy();
    //await landRegistry.deployed();
  });

  describe("Deployment", function () {
    // it("Should set the right owner", async function () {
    //   expect(await landRegistry.registryAuthority()).to.equal(ethers.constants.AddressZero);
    // });

    it("Should set the registry authority correctly", async function () {
      await landRegistry.setRegistryAuthority(owner.address);
      expect(await landRegistry.registryAuthority()).to.equal(owner.address);
    });

    it("Should fail if setting the registry authority again", async function () {
      await landRegistry.setRegistryAuthority(owner.address);
      await expect(landRegistry.setRegistryAuthority(addr1.address)).to.be.revertedWith("Registry authority address already set");
    });
  });

  describe("Land Registration", function () {
    beforeEach(async function () {
      await landRegistry.setRegistryAuthority(owner.address);
    });

    it("Should register a new land", async function () {
      await landRegistry.registerLand("Location A", 100, addr1.address, "PROP123");
      const land = await landRegistry.lands(0);
      expect(land.location).to.equal("Location A");
      expect(land.area).to.equal(100);
      expect(land.currentOwner).to.equal(addr1.address);
      expect(land.propertyId).to.equal("PROP123");
      expect(land.isRegistered).to.equal(true);
    });

    it("Should emit LandRegistered event", async function () {
      await expect(landRegistry.registerLand("Location B", 200, addr2.address, "PROP456"))
        .to.emit(landRegistry, "LandRegistered")
        .withArgs(1, "Location B", 200, addr2.address, "PROP456");
    });

    it("Should fail if non-registry authority tries to register land", async function () {
      await expect(landRegistry.connect(addr1).registerLand("Location C", 300, addr1.address, "PROP789"))
        .to.be.revertedWith("Only registry authority can perform this action");
    });
  });

  describe("Ownership Transfer", function () {
    beforeEach(async function () {
      await landRegistry.setRegistryAuthority(owner.address);
      await landRegistry.registerLand("Location A", 100, addr1.address, "PROP123");
    });

    it("Should transfer ownership", async function () {
      await landRegistry.connect(addr1).transferOwnership(1, addr2.address);
      const land = await landRegistry.lands(0);
      expect(land.currentOwner).to.equal(addr2.address);
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(landRegistry.connect(addr1).transferOwnership(1, addr2.address))
        .to.emit(landRegistry, "OwnershipTransferred")
        .withArgs(1, addr2.address);
    });

    it("Should fail if non-owner tries to transfer ownership", async function () {
      await expect(landRegistry.connect(addr2).transferOwnership(1, addr2.address))
        .to.be.revertedWith("Only current owner can transfer ownership");
    });
  });

  describe("Land Verification", function () {
    beforeEach(async function () {
      await landRegistry.setRegistryAuthority(owner.address);
      await landRegistry.registerLand("Location A", 100, addr1.address, "PROP123");
    });

    it("Should return land details", async function () {
      const land = await landRegistry.verifyLand(1);
      expect(land.location).to.equal("Location A");
      expect(land.area).to.equal(100);
      expect(land.currentOwner).to.equal(addr1.address);
      expect(land.isRegistered).to.equal(true);
      expect(land.propertyId).to.equal("PROP123");
    });

    it("Should fail if land does not exist", async function () {
      await expect(landRegistry.verifyLand(2)).to.be.revertedWith("Land does not exist");
    });
  });

  describe("Get Registered Lands", function () {
    beforeEach(async function () {
      await landRegistry.setRegistryAuthority(owner.address);
      await landRegistry.registerLand("Location A", 100, addr1.address, "PROP123");
      await landRegistry.registerLand("Location B", 200, addr2.address, "PROP456");
    });

    it("Should return all registered lands", async function () {
      const lands = await landRegistry.getRegisteredLands();
      expect(lands.length).to.equal(2);
      expect(lands[0].location).to.equal("Location A");
      expect(lands[1].location).to.equal("Location B");
    });
  });
});
