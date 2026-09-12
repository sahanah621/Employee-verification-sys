import { expect } from "chai";
import { ethers } from "hardhat";

describe("EmploymentRegistry Skeleton", function () {
  it("Should deploy successfully and register an employer", async function () {
    const [owner, employer] = await ethers.getSigners();

    const EmploymentRegistry = await ethers.getContractFactory("EmploymentRegistry");
    const registry = await EmploymentRegistry.deploy();
    await registry.waitForDeployment();

    const address = await registry.getAddress();
    expect(address).to.be.properAddress;

    // Test employer registration skeleton
    await registry.connect(employer).registerEmployer("Acme Corporation");
    const profile = await registry.employers(employer.address);

    expect(profile.isRegistered).to.equal(true);
    expect(profile.organizationName).to.equal("Acme Corporation");
  });
});
