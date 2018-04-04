FROM node:9-alpine
ENV NODE_ENV production
RUN mkdir /root/temperature_hub_poll
COPY ./build /root/temperature_hub_poll/
COPY ./package.json /root/temperature_hub_poll/package.json
COPY ./start.sh /root/temperature_hub_poll/start.sh
WORKDIR /root/temperature_hub_poll
RUN echo "* * * * *  node /root/temperature_hub_poll/main.js >> /var/log/tp.log 2>&1 " >> /etc/crontabs/root
RUN yarn install
ENTRYPOINT ["/root/temperature_hub_poll/start.sh"]
