import NotionProvider from '@providers/notion.provider';

class JobRepository {
  static async findAll() {
    return await NotionProvider.fetchDatabase();
  }

  static async findByStatus(status: string) {
    const all = await this.findAll();
    return all.filter(
      (job) => job['Status']?.toUpperCase() === status.toUpperCase()
    );
  }

  static async findByNotionId(notionId: string) {
    const all = await this.findAll();
    return all.find((job) => job.notionId === notionId) ?? null;
  }

  static async findByRoleType(roleType: string) {
    const all = await this.findAll();
    const target = roleType.toLowerCase();
    return all.filter((job) =>
      (job['Role Type'] || []).some((rt) => rt.toLowerCase() === target)
    );
  }
}

export = JobRepository;
