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
  <a href="https://github.com/wiredmonash/monstar/issues">Issues</a>
  <span> · </span>
  <a href="https://monstar.wired.org.au/changelog">Changelog</a>
</h3>

<br/>

## What is MonSTAR?

MonSTAR helps Monash University students make informed decisions about their unit selections. The platform aggregates student reviews and SETU (Student Evaluation of Teaching and Units) data from 2019 onwards, providing both qualitative experiences and quantitative metrics for thousands of units.

Students can browse units, read peer reviews, compare SETU scores across semesters, and contribute their own experiences after completing units.

## Features

MonSTAR provides several features for exploring and reviewing Monash subjects:

<table>
  <tr>
    <td width="50%"><b>Unit Search</b><br>Search by unit code or name, with filters for teaching period, faculty, and more</td>
    <td width="50%"><b>Student Reviews</b><br>Read and write reviews with ratings across enjoyment, simplicity, and usefulness</td>
  </tr>
  <tr>
    <td width="50%"><b>AI Sentiment Overviews</b><br>Gemini summaries of sentiment across a unit's student reviews</td>
    <td width="50%"><b>SETU Data</b> <img alt="removed" src="https://img.shields.io/badge/removed-d73a4a?style=flat-square"><br>Historical SETU results from semester 1 2019 to the latest (authentication required)</td>
  </tr>
  <tr>
    <td width="50%"><b>Unit Pathways Map</b><br>Interactive graph of unit pathways, prerequisites, and follow-on requirements</td>
    <td width="50%"><b>Google Authentication</b><br>Monash student and staff verification by email</td>
  </tr>
  <tr>
    <td width="50%"><b>Review Interactions</b><br>Like and dislike reviews with notifications</td>
    <td width="50%"><b>Unit Tags</b><br>Dynamically assigned tags like "WAM Booster"</td>
  </tr>
  <tr>
    <td width="50%"><b>Jobs Board</b> <img alt="new" src="https://img.shields.io/badge/new-2da44e?style=flat-square"><br>Browse open roles with Monash student teams, clubs, and societies</td>
    <td width="50%"><b>Grade Calculator</b> <img alt="coming soon" src="https://img.shields.io/badge/coming_soon-8957e5?style=flat-square"><br>Calculate your WAM and GPA and project semester results</td>
  </tr>
  <tr>
    <td width="50%"><b>Global Chat</b> <img alt="coming soon" src="https://img.shields.io/badge/coming_soon-8957e5?style=flat-square"><br>Real-time chat with other Monash students</td>
    <td width="50%"><b>Course Planner</b> <img alt="coming soon" src="https://img.shields.io/badge/coming_soon-8957e5?style=flat-square"><br>Map out your degree and plan units semester by semester</td>
  </tr>
</table>

## Screenshots

<table>
  <tr>
    <td width="50%"><img alt="Home" src=".docs/product/home.png"><br><b>Home</b> - explore units and see what's trending</td>
    <td width="50%"><img alt="Browse units" src=".docs/product/list.png"><br><b>Browse</b> - search and filter by rating, campus, and teaching period</td>
  </tr>
  <tr>
    <td width="50%"><img alt="Unit page" src=".docs/product/overview.png"><br><b>Unit page</b> - ratings, reviews, and a Gemini sentiment overview</td>
    <td width="50%"><img alt="Pathways map" src=".docs/product/map.png"><br><b>Pathways</b> - prerequisites and follow-on units as an interactive graph</td>
  </tr>
</table>

## Architecture
### System context
![System Context](.docs/1_System_Context.png)
### Container diagram
![Container Diagram](.docs/2_Container_Diagram.png?v=2)

## Contributing

MonSTAR was built by Monash students. Contributions are welcome from the community.

Before starting work on a feature, please read the [Contributing Guide](./CONTRIBUTING.md) for:
- Development environment setup
- Code style and conventions
- Pull request process
- Testing requirements

You can contribute by:
- Reporting bugs or suggesting features via [GitHub Issues](https://github.com/wiredmonash/monstar/issues)
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
**Issues:** [GitHub Issues](https://github.com/wiredmonash/monstar/issues)

## License

This project is licensed under the AGPL 3.0 License - see the [LICENSE](LICENSE) file for details.
