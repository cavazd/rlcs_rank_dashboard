# -------------------------
# author: cavazd
# date  : 5/10/2022
# desc  : Code to restructure rlcs_[region]_points.csv for bump chart
# -------------------------

# Load in tidyverse and remove and variables in environment
library(tidyverse)
rm(list=ls())

# load in data for the given region
# -------------------------

region <- "ssa"

score_df <- read.csv(
  file = paste0("../data/rlcs_", region, "_points.csv"),
  stringsAsFactors = T,
)

score_df <- score_df %>% select(!starts_with('deduction'))

# create empty dataframe for dataframe stacking
# -------------------------
num_events <- ncol(score_df[-1]) # num of cols without team_name

rank_df <- data.frame()

# add rankings for each event to  rank_df
# -------------------------
for (event in 1:num_events) {
  # save to a temp dataframe, select variables from start upto current event
  temp_df <- score_df %>% select(1:(event+1)) %>%
    # add the score by taking the sum of all event vars
    # add event as an int of the current event
    mutate('score' = rowSums(select(., 2:(event+1))),
           'event' = event) %>%
    # remove the different event vars
    select(-(2:(event+1))) %>%
    # arrange by score and team (alphabetical)
    arrange(desc(score), team) %>%
    # add ranking after sorting (1 to number of teams)
    # add the event name in as well
    mutate('ranking' = c(1:nrow(.)),
           'eventname' = colnames(score_df)[event+1])

  # append the temporary dataframe onto rank_df
  rank_df <- rbind(rank_df, temp_df)
}

rank_df <- score_df %>% 
  pivot_longer(-team, names_to = "eventname", values_to = "score_change") %>% 
  right_join(rank_df, by = c("team", "eventname")) %>% 
  mutate(region = region)

# write transformed data to a new csv file
# -------------------------
write.csv(
  x = rank_df,
  file = paste0("../data/rlcs_", region, "_ranks.csv"),
  row.names = F
)

