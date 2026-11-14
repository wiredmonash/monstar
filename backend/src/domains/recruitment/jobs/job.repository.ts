import NotionProvider from './notion.gateway';

class JobRepository {
  static async findAll() {
    return await NotionProvider.fetchDatabase();
  }
}

export default JobRepository;
