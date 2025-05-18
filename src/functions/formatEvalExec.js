const { AttachmentBuilder, codeBlock, ContainerBuilder, FileBuilder, heading, HeadingLevel, TextDisplayBuilder } = require("discord.js");
const { colours } = require("@magicalbunny31/pawesome-utility-stuffs");


module.exports = (input, output, isEvaluate, emojis) => {
   // payload for the evaluate/execute command (and initialise the container)
   const components = [
      new ContainerBuilder()
         .setAccentColor(colours.fennec)
   ];

   const files = [];


   // format the input and the output
   const formatCode = (input, name) => input
      ? codeBlock(isEvaluate ? `js` : `bash`, input)
      : JSON.stringify(input)
         ? codeBlock(input)
         : `${emojis.rip} no ${name} could be displayed here..`;

   const formattedInput  = formatCode(input, `input`);
   const formattedOutput = formatCode(output, `output`);

   const maxLength = 2000;


   // add the input heading to the container
   components[0].addTextDisplayComponents(
      new TextDisplayBuilder()
         .setContent(
            heading(`${emojis.inbox} input`, HeadingLevel.Three)
         )
   );


   // add the formatted input to the container
   if (formattedInput.length <= maxLength)
      components[0].addTextDisplayComponents(
         new TextDisplayBuilder()
            .setContent(formattedInput)
      );

   else {
      components[0].addFileComponents(
         new FileBuilder()
            .setURL(`attachment://input.${input ? isEvaluate ? `js` : `sh` : `txt`}`)
      );

      files.push(
         new AttachmentBuilder()
            .setFile(
               Buffer.from(input || JSON.stringify(input))
            )
            .setName(`input.${input ? `js` : `txt`}`)
      );
   };


   // add the output heading to the container
   components[0].addTextDisplayComponents(
      new TextDisplayBuilder()
         .setContent(
            heading(`${emojis.outbox} output`, HeadingLevel.Three)
         )
   );


   // add the formatted output to the container
   if (formattedOutput.length <= maxLength)
      components[0].addTextDisplayComponents(
         new TextDisplayBuilder()
            .setContent(formattedOutput)
      );

   else {
      components[0].addFileComponents(
         new FileBuilder()
            .setURL(`attachment://output.${output ? isEvaluate ? `js` : `sh` : `txt`}`)
      );

      files.push(
         new AttachmentBuilder()
            .setFile(
               Buffer.from(output || JSON.stringify(output))
            )
            .setName(`output.${output ? `js` : `txt`}`)
      );
   };


   // return the components and files
   return { components, files };
};