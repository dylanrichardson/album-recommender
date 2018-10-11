Final Project -- Album Recommender
===

## Team LongQueue | longqueue.herokuapp.com
Jacob Fakult & Dylan Richardson

This website allows you to log into your Spotify account, search for your favorite albums, and then recieve recommendations for similar albums.

tech:
recommendations
multi-device friendly
hide

design:
arrows to improve device compatibility + site usability
netflix style (Gestalt principle of familiarity)
collapsible bars
responsive (loading, mouse interaction)


## Technical Achievements
- **Album Recommendation Algorithm**: Utilized Spotify API with artist and track list information of favorited albums in order to generate recommended albums for each user. This proved difficult because 1) Spotify has a limit to the amount of information you can upload at once, and 2) the Spotify API does not provide a pre-made endpoint for album recommendations
- **Multi-device login**: Users can now log in through multiple devices due to improved cookie/token management.
- **Hide recommendtions**: We gave users the option to hide albums from future recommendations. This information is stored in the Mongo database along with other user information.

### Design/Evaluation Achievements
- **Netflix Style Design**: We tried to follow the Gestalt principle of similarity to create a Netflix-style design for the sign that users might find familiar.
- **Animated collapsible content sections**: We designed the site in three sections: search, favorites, and recommendations. If any of these three sections are empty, it will shrink, allowing the other sections to expand, enlarging the content on the screen and reducing negative space.
- **Responsive/Interactive elements**: The site contains many user interaction triggers such as hovering over albums and loading indicators.
- **Scrolling Accessability**: We added arrows on each album carousel in order to accomodate users who are unable to scroll horizontally, as well as provide an indication for the dimensions of the carousel.
