FROM ruby:2.3 as build

ENV JEKYLL_ENV: production
WORKDIR /usr/src/app

COPY ../ /usr/src/app

RUN bundle install && \
    bundle exec jekyll build -d public