import { describe, expect, it } from "vitest";
import { makeTeamWorkerExportRows, matchesWorkerSearch, workersInTeam } from "./workforceSearch";

describe("matchesWorkerSearch", () => {
  const worker = { phoneticName: "bo len", employeeCode: "NC-001" };

  it("tìm theo tên phiên âm không phân biệt chữ hoa thường", () => {
    expect(matchesWorkerSearch(worker, "BO LEN")).toBe(true);
  });

  it("tìm theo mã số và không khớp với từ khóa khác", () => {
    expect(matchesWorkerSearch(worker, "nc-001")).toBe(true);
    expect(matchesWorkerSearch(worker, "NC-099")).toBe(false);
  });
});

describe("workersInTeam", () => {
  it("chỉ lấy danh sách thuộc đúng Đội đang xem", () => {
    const workers = [
      { unit: "Đội 1", phoneticName: "bo len" },
      { unit: "Đội 2", phoneticName: "bưởn" },
      { unit: "Đội 1", phoneticName: "chăm pa" },
    ];

    expect(workersInTeam(workers, "Đội 1").map(worker => worker.phoneticName)).toEqual(["bo len", "chăm pa"]);
  });
});

describe("makeTeamWorkerExportRows", () => {
  it("tạo dòng Excel dùng tên phiên âm và trạng thái nghiệp vụ", () => {
    expect(makeTeamWorkerExportRows([{ employeeCode: "NC-001", phoneticName: "bo len", roleTitle: "Công nhân khai thác", status: "active" }])).toEqual([{
      "Mã số": "NC-001",
      "Tên phiên âm": "bo len",
      "Vai trò": "Công nhân khai thác",
      "Trạng thái": "Đang làm việc",
    }]);
  });
});
