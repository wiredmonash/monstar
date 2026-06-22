import NotionProvider from '@providers/notion.provider';

class JobRepository {
  static async findAll() {
    return await NotionProvider.fetchDatabase();
  }

  static async findByStatus(status) {
    const all = await this.findAll();
    return all.filter(
      (job) => job['Status']?.toUpperCase() === status.toUpperCase()
    );
  }

  static async findByNotionId(notionId) {
    const all = await this.findAll();
    return all.find((job) => job.notionId === notionId) ?? null;
  }

  static async findByRoleType(roleType) {
    const all = await this.findAll();
    const target = roleType.toLowerCase();
    return all.filter((job) =>
      (job['Role Type'] || []).some((rt) => rt.toLowerCase() === target)
    );
  }
}

export = JobRepository;
