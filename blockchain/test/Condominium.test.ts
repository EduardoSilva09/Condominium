import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Condominium", function () {
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

  async function deployFixture() {
    const [manager, resident] = await hre.ethers.getSigners();

    const Condominium = await hre.ethers.getContractFactory("Condominium");
    const contract = await Condominium.deploy();

    return { contract, manager, resident };
  }

  it("Should be residence", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    expect(await contract.residenceExists(2102)).to.equal(true);
  });

  it("Should add residet", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    expect(await contract.isResident(resident.address)).to.equal(true);
  });

  it("Should NOT add residet (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await expect(instance.addResident(resident.address, 2102))
      .to.be.revertedWith("Only the manager or the counselors can do this")
  });

  it("Should NOT add residet (residence)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await expect(contract.addResident(resident.address, 0))
      .to.be.revertedWith("This residence does not exists")
  });

  it("Should remove residet ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await contract.removeResident(resident.address);

    expect(await contract.isResident(resident.address)).to.equal(false);
  });

  it("Should NOT remove residet (permission) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    const instance = contract.connect(resident);

    await expect(instance.removeResident(resident.address))
      .to.be.revertedWith("Only the manager can do this");
    expect(await contract.isResident(resident.address)).to.equal(true);
  });

  it("Should set councelor ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await contract.setCouncelor(resident.address, true);

    expect(await contract.counselors(resident.address)).to.equal(true);
  });

  it("Should NOT set councelor (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    const instance = contract.connect(resident);

    await expect(instance.setCouncelor(resident.address, true))
      .to.be.revertedWith("Only the manager can do this");
    expect(await contract.counselors(resident.address)).to.equal(false);
  });

  it("Should NOT set councelor (external resident)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await expect(contract.setCouncelor(resident.address, true))
      .to.be.revertedWith("The councelor must be a resident");
    expect(await contract.counselors(resident.address)).to.equal(false);
  });

  it("Should NOT remove residet (councelor) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await contract.setCouncelor(resident.address, true);

    await expect(contract.removeResident(resident.address))
      .to.be.revertedWith("A counceler cannot be removed");
    expect(await contract.isResident(resident.address)).to.equal(true);
  });

  it("Should set manager ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.setManager(resident.address);
    expect(await contract.manager()).to.equal(resident.address);
  });

  it("Should NOT set manager (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await expect(instance.setManager(resident.address))
      .to.be.revertedWith("Only the manager can do this");
  });

  // it("Should NOT set manager (invalid address)", async function () {
  //   const { contract, manager, resident } = await loadFixture(deployFixture);
  //   await expect(contract.setManager("0x000000000000000000000000000000000000000"))
  //     .to.be.revertedWith("The address must be valid");
  // });

  it("Should add topic (manager)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes");
    expect(await contract.topicExists("Topico")).to.equal(true);
  });

  it("Should add topic (resident)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await contract.addResident(resident.address, 2102);
    await instance.addTopic("Topico", "Topico de testes");
    expect(await instance.topicExists("Topico")).to.equal(true);
  });

  it("Should NOT add topic (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await expect(instance.addTopic("Topico", "Topico de testes"))
      .to.be.revertedWith("Only the manager or the residents can do this");
  });

  it("Should NOT add topic (Duplicated)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes");
    await expect(contract.addTopic("Topico", "Topico de testes"))
      .to.be.revertedWith("This topic already exists");
  });

  it("Should remove topic ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes");
    await contract.removeTopic("Topico");
    expect(await contract.topicExists("Topico")).to.equal(false);
  });

  it("Should NOT remove topic (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes");
    const instance = contract.connect(resident);
    await expect(instance.removeTopic("Topico"))
      .to.be.revertedWith("Only the manager can do this");
  });

  it("Should NOT remove topic (nonexistent)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await expect(contract.removeTopic("Topico"))
      .to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT remove topic (status)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes");
    await contract.openVoting("Topico");

    await expect(contract.removeTopic("Topico"))
      .to.be.revertedWith("Only IDLE topics can be removed");
  });

  it("Should vote ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes");
    await contract.openVoting("Topico");

    const instance = contract.connect(resident);
    await instance.vote("Topico", Options.YES);

    expect(await instance.numberOfVotes("Topico")).to.equal(1);
  });

  it("Should NOT vote (duplicated) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes");
    await contract.openVoting("Topico");

    const instance = contract.connect(resident);
    await instance.vote("Topico", Options.YES);
    await expect(instance.vote("Topico", Options.YES))
      .to.be.revertedWith("A residence should vote only once");
    expect(await instance.numberOfVotes("Topico")).to.equal(1);
  });

  it("Should NOT vote (empty vote) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes");
    await contract.openVoting("Topico");

    const instance = contract.connect(resident);
    await expect(instance.vote("Topico", Options.EMPTY))
      .to.be.revertedWith("The option cannot be EMPTY");
  });

  it("Should NOT vote (invalid topic) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    const instance = contract.connect(resident);
    await contract.addResident(resident.address, 2102);

    await expect(instance.vote("Topico", Options.YES))
      .to.be.revertedWith("The topic does not exists");
  });

  it("Should NOT vote (status) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes");
    const instance = contract.connect(resident);

    await expect(instance.vote("Topico", Options.YES))
      .to.be.revertedWith("Only VOTING topics can be voted");
  });

  it("Should NOT vote (permission) ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await contract.addTopic("Topico", "Topico de testes");
    const instance = contract.connect(resident);

    await expect(instance.vote("Topico", Options.YES))
      .to.be.revertedWith("Only the manager or the residents can do this");
  });

  it("Should close voting ", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes");
    await contract.openVoting("Topico");
    await contract.vote("Topico", Options.YES);

    const instance = contract.connect(resident);
    await instance.vote("Topico", Options.YES);
    await contract.closeVoting("Topico");
    const topic = await contract.getTopic("Topico");

    expect(topic.status).to.equal(Status.APPROVED);
  });

  it("Should NOT close voting (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addResident(resident.address, 2102);
    await contract.addTopic("Topico", "Topico de testes");
    await contract.openVoting("Topico");

    const instance = contract.connect(resident);
    await instance.vote("Topico", Options.YES);
    await expect(instance.closeVoting("Topico"))
      .to.be.revertedWith("Only the manager can do this");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should NOT close voting (status)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addTopic("Topico", "Topico de testes");

    await expect(contract.closeVoting("Topico"))
      .to.be.revertedWith("Only VOTING topics can be closed");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.IDLE);
  });

  it("Should NOT close voting (invalid topic)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);
    await expect(contract.closeVoting("Topico"))
      .to.be.revertedWith("The topic does not exists");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.IDLE);
  });

  it("Should open voting", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addTopic("Topico", "Topico de testes");
    await contract.openVoting("Topico");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.VOTING);
  });

  it("Should NOT open voting (permission)", async function () {
    const { contract, manager, resident } = await loadFixture(deployFixture);

    await contract.addTopic("Topico", "Topico de testes");
    const instance = contract.connect(resident);
    await expect(instance.openVoting("Topico"))
      .to.be.revertedWith("Only the manager can do this");

    const topic = await contract.getTopic("Topico");
    expect(topic.status).to.equal(Status.IDLE);
  });
});
