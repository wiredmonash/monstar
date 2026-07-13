[![stars](https://custom-icon-badges.demolab.com/github/stars/wiredmonash/monstar?logo=star&style=flat)](https://github.com/wiredmonash/monstar/stargazers "stars")
[![issues](https://custom-icon-badges.demolab.com/github/issues-raw/wiredmonash/monstar?logo=issue)](https://github.com/wiredmonash/monstar/issues "issues")
[![pull requests](https://custom-icon-badges.demolab.com/github/issues-pr-closed/wiredmonash/monstar?color=purple&logo=git-pull-request&logoColor=white)](https://github.com/wiredmonash/monstar/pulls "pull requests")
[![code size](https://custom-icon-badges.demolab.com/github/languages/code-size/wiredmonash/monstar?logo=file-code&logoColor=white)](https://github.com/wiredmonash/monstar "code size")

<p align="center">
  <img alt="MonSTAR banner" src="frontend/public/banner.png" />
</p>

<p align="center">
  <i>A digital platform built for students at Monash University. Real unit reviews from students.</i>
</p>

<h3 align="center">
  <a href="https://monstar.wired.org.au">Website</a>
  <span> · </span>
  <a href="./CONTRIBUTING.md">Contributing</a>
  <span> · </span>
  <a href="https://github.com/wired-projects/monstar/issues">Issues</a>
  <span> · </span>
  <a href="https://monstar.wired.org.au/changelog">Changelog</a>
</h3>

<br/>

## What is MonSTAR?

MonSTAR helps Monash University students make informed decisions about their unit selections. The platform aggregates student reviews and SETU (Student Evaluation of Teaching and Units) data from 2019 onwards, providing both qualitative experiences and quantitative metrics for thousands of units.

Students can browse units, read peer reviews, compare SETU scores across semesters, and contribute their own experiences after completing units.

## Features

MonSTAR provides several features for exploring and reviewing Monash subjects:

- **Unit Search** - Search by unitcode or the name, additional filtering by teaching period, faculty, etc
- **Student Reviews** - Read and write reviews with ratings across enjoyment, simplicity, usefulness
- **AI Sentiment Overviews** - Gemini AI overviews for units, reviewing existing student review sentiment
- **SETU Data** - Historical SETU results from sem 1 2019 up to most recent (authentication required)
- **Unit Pathways Map** - Interactive graph showing unit pathways, prerequistes and future requirements
- **Google Authentication** - Monash student/staff verification through email verification
- **Review Interactions** - Like/dislike reviews with notifications
- **Unit Tags** - Dynamically assigned tags like "WAM Booster"

## Architecture
### System context
![System Context](.docs/1_System_Context.png)
### Container diagram
![Container Diagram](.docs/2_Container_Diagram.png)

## Contributing

MonSTAR was built by Monash students. Contributions are welcome from the community.

Before starting work on a feature, please read the [Contributing Guide](./CONTRIBUTING.md) for:
- Development environment setup
- Code style and conventions
- Pull request process
- Testing requirements

You can contribute by:
- Reporting bugs or suggesting features via [GitHub Issues](https://github.com/wired-projects/monstar/issues)
- Fixing existing issues
- Improving documentation
- Adding new features (after discussing in an issue first)

## Contributors

<a href="https://github.com/wiredmonash/monstar/graphs/contributors">
  <img alt="Contributors" src="https://contrib.rocks/image?repo=wiredmonash/monstar" />
</a>

## Data Sources

MonSTAR's unit catalog and SETU data are sourced using tools developed by **Sai Kumar Murali Krishnan**:
- [monash-handbook-scraper](https://github.com/saikumarmk/monash-handbook-scraper) - Unit metadata extraction
- [unit-outcome-miner](https://github.com/saikumarmk/unit-outcome-miner) - SETU survey data aggregation

## Contact

**Developed by:** WIRED Projects Team, Monash University \
**Primary person of contact:** [@jenul-ferdinand](https://github.com/jenul-ferdinand) on GitHub or proxy_dev on Discord\
**Issues:** [GitHub Issues](https://github.com/wired-projects/monstar/issues)

## License

This project is licensed under the AGPL 3.0 License - see the [LICENSE](LICENSE) file for details.
