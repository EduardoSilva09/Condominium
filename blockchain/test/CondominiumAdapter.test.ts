import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("CondominiumAdapter", function () {
  enum Options {
    EMPTY,
    YES,
    NO,
    ABSTENTION
  }

  enum Status {
    IDLE,
    VOTING,
    APPROVED,
    DENIED
  }

  async function deployAdapterFixture() {
    const accounts = await hre.ethers.getSigners();
    const manager = accounts[0];

    const CondominiumAdapter = await hre.ethers.getContractFactory("CondominiumAdapter");
    const adapter = await CondominiumAdapter.deploy();

    return { adapter, accounts, manager };
  }

  async function deployImplementationFixture() {
    const Condominium = await hre.ethers.getContractFactory("Condominium");
    const contract = await Condominium.deploy();

    return { contract };
  }

  it("Should upgrade", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    const address = await adapter.getImplementationAddress();

    expect(await contract.getAddress()).to.equal(address);
  });

  it("Should NOT upgrade (permission)", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);
    const instance = adapter.connect(accounts[1]);
    const address = await contract.getAddress();
    await expect(instance.upgrade(address))
      .to.be.revertedWith("You do not have permission");
  });

  it("Should add resident ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 2102);

    expect(await contract.isResident(accounts[1].address)).to.equal(true);
  });

  it("Should add resident ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 2102);

    expect(await contract.isResident(accounts[1].address)).to.equal(true);
  });

  it("Should remove resident ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 2102);

    await adapter.removeResident(accounts[1].address);

    expect(await contract.isResident(accounts[1].address)).to.equal(false);
  });

  it("Should set counselor ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 1301);
    await adapter.setCouncelor(accounts[1].address, true)

    expect(await contract.counselors(accounts[1].address)).to.equal(true);
  });

  it("Should add topic ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste");

    expect(await contract.topicExists("topic")).to.equal(true);
  });

  it("Should remove topic ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste")
    await adapter.removeTopic("topic")

    expect(await contract.topicExists("topic")).to.equal(false);
  });

  it("Should open voting ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste")
    await adapter.openVoting("topic");
    const topic = await contract.getTopic("topic");

    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should vote ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 1301);
    await adapter.addTopic("topic", "description topic teste")
    await adapter.openVoting("topic");
    const instance = adapter.connect(accounts[1])
    await instance.vote("topic", Options.YES);
    expect(await contract.numberOfVotes("topic")).to.equal(1);
  });

  it("Should close voting ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 1301);
    await adapter.addTopic("topic", "description topic teste")
    await adapter.openVoting("topic");
    const instance = adapter.connect(accounts[1])
    await instance.vote("topic", Options.YES);
    await adapter.closeVoting("topic");

    const topic = await contract.getTopic("topic");

    expect(topic.status).to.equal(Status.APPROVED);
  });

});
