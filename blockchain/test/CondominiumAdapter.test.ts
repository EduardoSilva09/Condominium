import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { CondominiumAdapter } from "../typechain-types";
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

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

  enum Category {
    DECISION,
    SPENT,
    CHANGE_QUOTA,
    CHANGE_MANAGER
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

  function getResidenceId(i: number) {
    const blocks = (1000 * Math.ceil(i / 25));
    const floors = (100 * Math.ceil(i / 5));
    const units = (i - (5 * Math.floor((i - 1) / 5)));
    return blocks + floors + units;
  }

  async function addResidents(adapter: CondominiumAdapter, count: number, accounts: SignerWithAddress[]) {
    for (let i = 1; i <= count; i++) {
      await adapter.addResident(accounts[i - 1].address, getResidenceId(i));
    }
  }

  async function addVotes(adapter: CondominiumAdapter, count: number, accounts: SignerWithAddress[]) {
    for (let i = 1; i <= count; i++) {
      const instance = adapter.connect(accounts[i - 1])
      await instance.vote("topic", Options.YES);
    }
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

  it("Should NOT add resident (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.addResident(accounts[1].address, 2102))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should remove resident ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 2102);

    await adapter.removeResident(accounts[1].address);

    expect(await contract.isResident(accounts[1].address)).to.equal(false);
  });

  it("Should NOT remove resident (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.removeResident(accounts[1].address))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should set counselor ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 1301);
    await adapter.setCouncelor(accounts[1].address, true)

    expect(await contract.counselors(accounts[1].address)).to.equal(true);
  });

  it("Should NOT set counselor (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.setCouncelor(accounts[1].address, true))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should add topic ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address);

    expect(await contract.topicExists("topic")).to.equal(true);
  });

  it("Should NOT add topic (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should edit topic ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste", Category.SPENT, 1, manager.address);
    await adapter.editTopic("topic", "description topic teste atualizada", 3, manager.address);
    const topic = await contract.getTopic("topic");
    expect(topic.amount).to.equal(3);
    expect(topic.description).to.equal("description topic teste atualizada");
  });

  it("Should NOT edit topic (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.editTopic("topic", "description topic teste atualizada", 3, manager.address))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should remove topic ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address)
    await adapter.removeTopic("topic")

    expect(await contract.topicExists("topic")).to.equal(false);
  });

  it("Should NOT remove topic (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.removeTopic("topic"))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should open voting ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address)
    await adapter.openVoting("topic");
    const topic = await contract.getTopic("topic");

    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should NOT open voting (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.openVoting("topic"))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should vote ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await adapter.addResident(accounts[1].address, 1301);
    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address)
    await adapter.openVoting("topic");
    const instance = adapter.connect(accounts[1])
    await instance.vote("topic", Options.YES);
    expect(await contract.numberOfVotes("topic")).to.equal(1);
  });

  it("Should NOT vote (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.vote("topic", Options.YES))
      .to.be.revertedWith("You must upgrade first");
  });

  it("Should close voting ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);
    const { contract } = await loadFixture(deployImplementationFixture);

    await adapter.upgrade(await contract.getAddress());
    await addResidents(adapter, 5, accounts);

    await adapter.addTopic("topic", "description topic teste", Category.DECISION, 0, manager.address)
    await adapter.openVoting("topic");
    await addVotes(adapter, 5, accounts);
    await adapter.closeVoting("topic");

    const topic = await contract.getTopic("topic");

    expect(topic.status).to.equal(Status.APPROVED);
  });

  it("Should NOT close voting (upgrade) ", async function () {
    const { adapter, accounts, manager } = await loadFixture(deployAdapterFixture);

    await expect(adapter.closeVoting("topic"))
      .to.be.revertedWith("You must upgrade first");
  });

});
